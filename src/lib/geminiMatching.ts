import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from './config';

export interface GeminiMatchResult {
  match: boolean | 'ambiguous';
  confidence: 'exact' | 'high' | 'medium' | 'low' | 'ambiguous';
  reasoning: string;
  similarity?: number;
  source: 'gemini' | 'fallback';
}

export interface GeminiComparisonRequest {
  val1: string;
  val2: string;
  fieldName: string;
  context: 'insurance_policy' | 'general';
}

export class GeminiSemanticMatcher {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private cache: Map<string, GeminiMatchResult>;
  private requestQueue: GeminiComparisonRequest[] = [];
  private isProcessing: boolean = false;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }
    
    // Initialize cache first
    this.cache = new Map();
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: config.gemini.model, // Use model from configuration
      generationConfig: {
        temperature: 0.1, // Low temperature for consistent results
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 300, // Increased for better JSON responses
        responseMimeType: "text/plain", // Ensure plain text responses
      }
    });
  }

  /**
   * Compare two field values using Gemini AI
   */
  async compareFields(
    val1: string, 
    val2: string, 
    fieldName: string,
    context: 'insurance_policy' | 'general' = 'insurance_policy'
  ): Promise<GeminiMatchResult> {
    
    // Check cache first
    const cacheKey = this.getCacheKey(val1, val2, fieldName);
    if (this.cache.has(cacheKey)) {
      console.log(`💾 Cache hit for: "${val1}" vs "${val2}"`);
      return this.cache.get(cacheKey)!;
    }

    const prompt = this.buildComparisonPrompt(val1, val2, fieldName, context);
    
    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });
      
      const response = await result.response;
      const text = response.text();
      
      if (!text || text.trim() === '') {
        throw new Error('Empty response from Gemini API');
      }
      
      const parsed = this.parseGeminiResponse(text, val1, val2);
      
      // Cache the result
      this.cache.set(cacheKey, parsed);
      
      return parsed;
      
    } catch (error) {
      // Silently fallback to rule-based matching
      const fallback = this.fallbackToRuleBased(val1, val2);
      return fallback;
    }
  }

  /**
   * Batch comparison for multiple fields (more efficient)
   */
  async compareBatch(requests: GeminiComparisonRequest[]): Promise<GeminiMatchResult[]> {
    const results: GeminiMatchResult[] = [];
    
    // Process in batches of 5 to respect rate limits
    const batchSize = 5;
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(req => this.compareFields(req.val1, req.val2, req.fieldName, req.context))
      );
      results.push(...batchResults);
      
      // Small delay between batches to respect rate limits
      if (i + batchSize < requests.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  /**
   * Build the comparison prompt for Gemini 2.0 with explicit JSON requirement
   */
  private buildComparisonPrompt(val1: string, val2: string, fieldName: string, context: string): string {
    return `You are Gemini 2.0, Google's most advanced AI. Compare these insurance document field values for semantic equality using your advanced reasoning capabilities:

FIELD: "${fieldName}"
VALUE_A: "${val1}"
VALUE_B: "${val2}"

CRITICAL MATCHING RULES (use Gemini 2.0's advanced understanding):
1. DATES: "01-01-2025" = "1 jan 2025" = "January 1, 2025" (same date, any format)
2. CURRENCY: "$1,000,000" = "1000000" = "$1M" (same amount, any format)  
3. INSURANCE TERMS: "General Liability" = "GL" = "CGL" (industry standard abbreviations)
4. YES/NO: "Yes" = "Y" = "Included" vs "No" = "N" = "Excluded"
5. PERCENTAGES: "2.5%" = "2.5 percent" = "0.025"
6. NAMES: "John Smith Corp" = "J. Smith Corporation" (same entity, different format)
7. POLICY NUMBERS: "ABC123" = "ABC-123" = "ABC 123" (same ID, different separators)

Use your Gemini 2.0 advanced semantic understanding to determine if these values represent the same meaning.

RESPOND WITH ONLY THIS JSON FORMAT (no other text):

{
  "match": true,
  "confidence": "exact",
  "reasoning": "Gemini 2.0 analysis: both values represent the same semantic meaning",
  "similarity": 0.95
}

Valid values:
- match: true, false, or "ambiguous"
- confidence: "exact", "high", "medium", "low", "ambiguous"
- similarity: number 0.0 to 1.0`;
  }

  private parseGeminiResponse(response: string, val1: string, val2: string): GeminiMatchResult {
    try {
      if (!response || response.trim() === '') {
        throw new Error('Empty response from Gemini');
      }
      
      // Try to extract JSON from various response formats
      let jsonStr = '';
      
      // Method 1: Look for JSON object
      const jsonMatch = response.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      } else {
        // Method 2: Look for JSON in code blocks
        const codeBlockMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (codeBlockMatch) {
          jsonStr = codeBlockMatch[1];
        } else {
          // Method 3: Try to construct JSON from text analysis
          return this.parseTextResponse(response, val1, val2);
        }
      }
      
      // Clean the JSON string
      const cleanJson = jsonStr
        .replace(/```json\s*/, '')
        .replace(/```\s*$/, '')
        .replace(/^\s*```\s*/, '')
        .trim();
      
      const parsed = JSON.parse(cleanJson);
      
      // Validate the response structure
      if (typeof parsed.match === 'undefined') {
        throw new Error('Invalid response structure - missing match field');
      }

      return {
        match: parsed.match,
        confidence: parsed.confidence || 'medium',
        reasoning: parsed.reasoning || 'AI analysis',
        similarity: typeof parsed.similarity === 'number' ? parsed.similarity : 0.8,
        source: 'gemini'
      };
      
    } catch (error) {
      // Try to parse as text if JSON parsing fails
      return this.parseTextResponse(response, val1, val2);
    }
  }

  /**
   * Parse text response when JSON parsing fails
   */
  private parseTextResponse(response: string, val1: string, val2: string): GeminiMatchResult {
    const lowerResponse = response.toLowerCase();
    
    // Look for key indicators in the text
    const matchIndicators = ['same', 'equal', 'identical', 'match', 'equivalent', 'yes'];
    const noMatchIndicators = ['different', 'not equal', 'not the same', 'no match', 'distinct', 'no'];
    
    const hasMatch = matchIndicators.some(indicator => lowerResponse.includes(indicator));
    const hasNoMatch = noMatchIndicators.some(indicator => lowerResponse.includes(indicator));
    
    let match: boolean | 'ambiguous' = 'ambiguous';
    let confidence: 'exact' | 'high' | 'medium' | 'low' | 'ambiguous' = 'low';
    
    if (hasMatch && !hasNoMatch) {
      match = true;
      confidence = 'medium';
    } else if (hasNoMatch && !hasMatch) {
      match = false;
      confidence = 'medium';
    }
    
    return {
      match,
      confidence,
      reasoning: `Text analysis of Gemini response: "${response.substring(0, 100)}..."`,
      similarity: 0.5,
      source: 'gemini'
    };
  }

  /**
   * Fallback to rule-based matching when Gemini fails
   */
  private fallbackToRuleBased(val1: string, val2: string): GeminiMatchResult {
    // Import existing semantic matching as fallback
    const { areValuesSemanticallyEqual } = require('./semanticMatching');
    const result = areValuesSemanticallyEqual(val1, val2);
    
    return {
      match: result.match,
      confidence: result.confidence,
      reasoning: 'Rule-based fallback matching',
      similarity: result.similarity || 0,
      source: 'fallback'
    };
  }

  /**
   * Generate cache key for storing results
   */
  private getCacheKey(val1: string, val2: string, fieldName: string): string {
    return `${fieldName}:${val1}:${val2}`;
  }

  /**
   * Clear cache (useful for testing or memory management)
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; hitRate?: number } {
    return {
      size: this.cache.size
    };
  }
}
