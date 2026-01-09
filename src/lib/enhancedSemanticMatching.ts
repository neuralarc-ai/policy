import { GeminiSemanticMatcher, GeminiMatchResult } from './geminiMatching';
import { areValuesSemanticallyEqual } from './semanticMatching';

export interface EnhancedMatchResult {
  match: boolean | 'ambiguous';
  confidence: 'exact' | 'high' | 'medium' | 'low' | 'ambiguous';
  reasoning?: string;
  similarity?: number;
  source: 'exact' | 'rule-based' | 'gemini' | 'fallback';
}

// Map rule-based confidence to enhanced confidence
function mapConfidence(ruleBasedConfidence: 'exact' | 'synonym' | 'high' | 'ambiguous' | 'different'): 'exact' | 'high' | 'medium' | 'low' | 'ambiguous' {
  switch (ruleBasedConfidence) {
    case 'exact': return 'exact';
    case 'synonym': return 'high';
    case 'high': return 'high';
    case 'ambiguous': return 'ambiguous';
    case 'different': return 'low';
    default: return 'low';
  }
}

export class EnhancedSemanticMatcher {
  private geminiMatcher?: GeminiSemanticMatcher;
  private useGemini: boolean = false;
  private batchQueue: Array<{
    val1: string;
    val2: string;
    fieldName: string;
    resolve: (result: EnhancedMatchResult) => void;
  }> = [];
  private batchTimeout?: NodeJS.Timeout;

  constructor(geminiApiKey?: string) {
    // Initialize cache first
    this.batchQueue = [];
    
    if (geminiApiKey && geminiApiKey.trim()) {
      try {
        this.geminiMatcher = new GeminiSemanticMatcher(geminiApiKey);
        this.useGemini = true;
      } catch (error) {
        this.useGemini = false;
      }
    }
  }

  /**
   * Main comparison function with intelligent routing
   */
  async compareFieldsEnhanced(
    val1: string, 
    val2: string, 
    fieldName: string
  ): Promise<EnhancedMatchResult> {
    
    // 1. Quick exact match check (fastest)
    if (val1 === val2) {
      return { match: true, confidence: 'exact', source: 'exact' };
    }

    // Handle empty values
    if (!val1 && !val2) {
      return { match: true, confidence: 'exact', source: 'exact' };
    }
    if (!val1 || !val2) {
      return { match: false, confidence: 'exact', source: 'exact' };
    }

    // 2. Case-insensitive exact match
    if (val1.toLowerCase().trim() === val2.toLowerCase().trim()) {
      return { match: true, confidence: 'exact', source: 'exact' };
    }

    // 3. Rule-based semantic matching first (fast, no cost)
    const ruleBasedResult = areValuesSemanticallyEqual(val1, val2);
    
    // If rule-based gives exact match, use it
    if (ruleBasedResult.match === true && ruleBasedResult.confidence === 'exact') {
      return { 
        match: ruleBasedResult.match, 
        confidence: mapConfidence(ruleBasedResult.confidence), 
        similarity: ruleBasedResult.similarity,
        source: 'rule-based' 
      };
    }

    // If rule-based gives synonym match, use it (high confidence)
    if (ruleBasedResult.match === true && ruleBasedResult.confidence === 'synonym') {
      return { 
        match: ruleBasedResult.match, 
        confidence: 'high', // Map synonym to high confidence
        similarity: ruleBasedResult.similarity,
        source: 'rule-based' 
      };
    }

    // 4. Use Gemini for complex/ambiguous cases (with better error handling)
    if (this.useGemini && this.shouldUseAI(val1, val2, fieldName)) {
      try {
        const geminiResult = await this.geminiMatcher!.compareFields(val1, val2, fieldName);
        return {
          match: geminiResult.match,
          confidence: geminiResult.confidence,
          reasoning: geminiResult.reasoning,
          similarity: geminiResult.similarity,
          source: 'gemini'
        };
      } catch (error) {
        // Silently fall back to rule-based matching
      }
    }

    // 5. Return rule-based result as final fallback
    return { 
      match: ruleBasedResult.match, 
      confidence: mapConfidence(ruleBasedResult.confidence), 
      similarity: ruleBasedResult.similarity,
      source: 'fallback' 
    };
  }

  /**
   * Synchronous comparison (for backward compatibility)
   */
  compareFieldsSync(val1: string, val2: string, fieldName: string): EnhancedMatchResult {
    // Quick checks
    if (val1 === val2) return { match: true, confidence: 'exact', source: 'exact' };
    if (!val1 && !val2) return { match: true, confidence: 'exact', source: 'exact' };
    if (!val1 || !val2) return { match: false, confidence: 'exact', source: 'exact' };

    // Use rule-based for sync calls
    const result = areValuesSemanticallyEqual(val1, val2);
    return { 
      match: result.match, 
      confidence: mapConfidence(result.confidence), 
      similarity: result.similarity,
      source: 'rule-based' 
    };
  }

  /**
   * Batch comparison for better performance
   */
  async compareBatch(fields: Array<{
    val1: string;
    val2: string; 
    fieldName: string;
  }>): Promise<EnhancedMatchResult[]> {
    
    if (!this.useGemini) {
      // Use rule-based for all if no Gemini
      return fields.map(field => this.compareFieldsSync(field.val1, field.val2, field.fieldName));
    }

    const results: EnhancedMatchResult[] = [];
    
    // Separate into AI candidates and rule-based
    const aiCandidates: typeof fields = [];
    const ruleBasedCandidates: typeof fields = [];
    
    fields.forEach(field => {
      if (this.shouldUseAI(field.val1, field.val2, field.fieldName)) {
        aiCandidates.push(field);
      } else {
        ruleBasedCandidates.push(field);
      }
    });

    // Process rule-based synchronously
    const ruleBasedResults = ruleBasedCandidates.map(field => 
      this.compareFieldsSync(field.val1, field.val2, field.fieldName)
    );

    // Process AI candidates in batches
    const aiResults: EnhancedMatchResult[] = [];
    const batchSize = 5; // Process 5 at a time to respect rate limits

    for (let i = 0; i < aiCandidates.length; i += batchSize) {
      const batch = aiCandidates.slice(i, i + batchSize);
      const batchPromises = batch.map(field => 
        this.compareFieldsEnhanced(field.val1, field.val2, field.fieldName)
      );
      
      const batchResults = await Promise.all(batchPromises);
      aiResults.push(...batchResults);
      
      // Rate limiting delay
      if (i + batchSize < aiCandidates.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // Combine results in original order
    let ruleIndex = 0;
    let aiIndex = 0;
    
    fields.forEach(field => {
      if (this.shouldUseAI(field.val1, field.val2, field.fieldName)) {
        results.push(aiResults[aiIndex++]);
      } else {
        results.push(ruleBasedResults[ruleIndex++]);
      }
    });

    return results;
  }

  /**
   * Determine if field comparison should use AI
   */
  private shouldUseAI(val1: string, val2: string, fieldName: string): boolean {
    // Use AI for critical fields
    if (this.isCriticalField(fieldName)) {
      return true;
    }

    // Use AI for complex patterns that might benefit from semantic understanding
    const complexPatterns = [
      /\d{1,2}[\/\-\s]\w{3,9}[\/\-\s]\d{4}/, // Date patterns
      /\$[\d,]+(\.\d{2})?/, // Currency with commas
      /\d+\.?\d*\s*%/, // Percentages
      /[A-Z]{2,5}[\-\s]*\d+/, // Policy numbers
      /\b\d+\s*(street|avenue|road|blvd|drive|st|ave|rd)\b/i, // Addresses
      /^\d+\s+\w+\s+\d+$/, // "1 jan 2025" style dates
      /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i, // Month names
      /\b(yes|no|y|n|included|excluded|covered|not covered)\b/i // Yes/No variations
    ];

    const hasComplexPattern = complexPatterns.some(pattern => 
      pattern.test(val1) || pattern.test(val2)
    );

    // Also use AI if values are similar but not exact (potential semantic match)
    const similarity = this.calculateBasicSimilarity(val1, val2);
    const potentialSemantic = similarity > 0.3 && similarity < 0.9;

    return hasComplexPattern || potentialSemantic;
  }

  /**
   * Check if field is critical for insurance comparison
   */
  private isCriticalField(fieldName: string): boolean {
    const criticalKeywords = [
      'policy number', 'effective date', 'expiration date', 'premium',
      'limit', 'deductible', 'coverage', 'carrier', 'insured name',
      'retention', 'aggregate', 'occurrence', 'sublimit'
    ];
    
    const lowerField = fieldName.toLowerCase();
    return criticalKeywords.some(keyword => lowerField.includes(keyword));
  }

  /**
   * Basic string similarity calculation
   */
  private calculateBasicSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    if (s1.length === 0 && s2.length === 0) return 1;
    if (s1.length === 0 || s2.length === 0) return 0;
    
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    if (longer.length === 0) return 1;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Levenshtein distance calculation
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Get matcher status
   */
  public getStatus(): { 
    geminiEnabled: boolean; 
    cacheSize: number;
    apiAvailable: boolean;
  } {
    return {
      geminiEnabled: this.useGemini,
      cacheSize: this.geminiMatcher?.getCacheStats?.()?.size || 0,
      apiAvailable: !!this.geminiMatcher
    };
  }
}
