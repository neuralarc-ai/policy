// ===================================
// INSURANCE TERM SYNONYMS
// ===================================
import { SemanticMatchResult } from '@/types/document';

export const INSURANCE_SYNONYMS: Record<string, string[]> = {
  // Coverage terms
  'coverage': ['covered', 'protection', 'insured'],
  'limit': ['maximum', 'cap', 'ceiling'],
  'deductible': ['retention', 'self-insured retention', 'sir'],
  'premium': ['cost', 'price', 'rate'],
  'exclusion': ['excluded', 'not covered', 'exception'],
  'endorsement': ['rider', 'amendment', 'addendum', 'form'],
  'aggregate': ['total', 'combined', 'cumulative'],
  'occurrence': ['incident', 'event', 'claim'],
  'insured': ['policyholder', 'named insured', 'assured'],
  'carrier': ['insurer', 'insurance company', 'underwriter'],
  'effective date': ['inception date', 'start date', 'commencement date'],
  'expiration date': ['end date', 'termination date', 'expiry date'],
  'sublimit': ['sub-limit', 'per item limit', 'specific limit'],
  'liability': ['legal liability', 'third party liability'],
  'property': ['physical damage', 'property damage'],
  // Time and place variations
  'at the address of the named insured': ['at the address of named insured', 'at named insured address', 'at insured address'],
  'standard time': ['std time', 'st time'],
  'on both dates': ['on both date', 'both dates', 'for both dates'],
  'noted above': ['mentioned above', 'specified above', 'indicated above', 'described above', 'listed above'],
  // Common abbreviations
  'gl': ['general liability', 'cgl', 'commercial general liability'],
  'wc': ['workers compensation', 'workers comp'],
  'auto': ['automobile', 'vehicle', 'commercial auto'],
  'e&o': ['errors and omissions', 'professional liability'],
  'bop': ['businessowners policy', 'business owners'],
  'epl': ['employment practices liability'],
  'd&o': ['directors and officers'],
  // Yes/No variations
  'yes': ['y', 'included', 'covered', 'applicable'],
  'no': ['n', 'not included', 'not covered', 'not applicable', 'n/a'],
  'included': ['yes', 'covered', 'attached'],
  'excluded': ['no', 'not covered', 'not attached']
};

// ===================================
// SEMANTIC MATCHING UTILITIES
// ===================================

export function normalizeValue(value: string | null | undefined): string {
  if (!value) return '';
  return value.toString().trim().toLowerCase().replace(/\s+/g, ' ');
}

export function areValuesSemanticallyEqual(val1: string, val2: string): SemanticMatchResult {
  const norm1 = normalizeValue(val1);
  const norm2 = normalizeValue(val2);
  
  // Exact match
  if (norm1 === norm2) return { match: true, confidence: 'exact' } as const;
  
  // Empty values
  if (!norm1 && !norm2) return { match: true, confidence: 'exact' } as const;
  if (!norm1 || !norm2) return { match: false, confidence: 'exact' } as const;
  
  // Try currency matching first
  const currencyMatch = areCurrencyValuesEqual(val1, val2);
  if (currencyMatch.isCurrency) {
    return { match: currencyMatch.match, confidence: currencyMatch.match ? 'exact' : 'different' } as const;
  }
  
  // Try percentage matching
  const percentageMatch = arePercentagesEqual(val1, val2);
  if (percentageMatch.isPercentage) {
    return { match: percentageMatch.match, confidence: percentageMatch.match ? 'exact' : 'different' } as const;
  }
  
  // Try date matching
  const dateMatch = areDatesEqual(val1, val2);
  if (dateMatch.isDate) {
    return { match: dateMatch.match, confidence: dateMatch.match ? 'exact' : 'different' } as const;
  }
  
  // Check synonyms
  const lower1 = norm1.toLowerCase();
  const lower2 = norm2.toLowerCase();
  
  for (const [term, synonyms] of Object.entries(INSURANCE_SYNONYMS)) {
    const allTerms = [term, ...synonyms].map(t => t.toLowerCase());
    
    if (allTerms.includes(lower1) && allTerms.includes(lower2)) {
      return { match: true, confidence: 'synonym' } as const;
    }
  }
  
  // Enhanced semantic matching for insurance content
  const enhancedMatch = enhancedSemanticComparison(norm1, norm2);
  if (enhancedMatch.match) {
    return enhancedMatch;
  }
  
  // Fuzzy string matching - LOWERED thresholds for better insurance content matching
  const similarity = calculateStringSimilarity(lower1, lower2);
  if (similarity > 0.75) { // Lowered from 0.85
    return { match: true, confidence: 'high' } as const;
  } else if (similarity > 0.55) { // Lowered from 0.7 
    return { match: 'ambiguous', confidence: 'ambiguous', similarity } as const;
  }
  
  return { match: false, confidence: 'different' } as const;
}

// ===================================
// ENHANCED SEMANTIC MATCHING FOR INSURANCE CONTENT
// ===================================

export function enhancedSemanticComparison(text1: string, text2: string): SemanticMatchResult {
  // Remove common filler words and normalize
  const clean1 = removeFillerWords(text1);
  const clean2 = removeFillerWords(text2);
  
  // Check if core content is the same
  if (clean1 === clean2) {
    return { match: true, confidence: 'high' } as const;
  }
  
  // Check for substantial overlap with minor additions
  const overlapScore = calculateContentOverlap(clean1, clean2);
  if (overlapScore > 0.75) { // Lowered from 0.8 for better matching
    return { match: true, confidence: 'high' } as const;
  } else if (overlapScore > 0.6) { // Lowered from 0.65  
    return { match: 'ambiguous', confidence: 'ambiguous', similarity: overlapScore } as const;
  }
  
  // Check for time/place patterns specifically  
  if (isTimeOrPlaceExpiry(text1) && isTimeOrPlaceExpiry(text2)) {
    const timeMatch = compareTimePatterns(text1, text2);
    if (timeMatch > 0.65) { // Lowered threshold
      return { match: true, confidence: 'high' } as const;
    } else if (timeMatch > 0.5) {
      return { match: 'ambiguous', confidence: 'ambiguous', similarity: timeMatch } as const;
    }
  }
  
  // Special handling for insurance policy language - check if one text is just an expansion of the other
  if (isTextExpansion(text1, text2)) {
    return { match: true, confidence: 'high' } as const;
  }
  
  return { match: false, confidence: 'different' } as const;
}

export function isTextExpansion(text1: string, text2: string): boolean {
  const shorter = text1.length < text2.length ? text1 : text2;
  const longer = text1.length < text2.length ? text2 : text1;
  
  // If one text is much longer, check if the shorter one is basically contained in the longer one
  if (longer.length > shorter.length * 1.3) {
    const shorterWords = new Set(shorter.toLowerCase().split(/\s+/));
    const longerWords = new Set(longer.toLowerCase().split(/\s+/));
    
    // Check if most of the shorter text's words are in the longer text
    const commonWords = [...shorterWords].filter(word => longerWords.has(word));
    const containmentRatio = commonWords.length / shorterWords.size;
    
    // If 85% of the shorter text is contained in the longer text, it's likely an expansion
    return containmentRatio >= 0.85;
  }
  
  return false;
}

export function removeFillerWords(text: string): string {
  const fillerWords = [
    'the', 'at', 'of', 'and', 'or', 'in', 'on', 'to', 'for', 'with', 'by', 'from',
    'above', 'below', 'noted', 'both', 'all', 'any', 'each', 'every', 'some',
    'such', 'other', 'same', 'different', 'various', 'certain', 'particular',
    'specified', 'mentioned', 'indicated', 'described', 'following', 'preceding'
  ];
  
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter(word => !fillerWords.includes(word))
    .join(' ')
    .trim();
}

export function calculateContentOverlap(text1: string, text2: string): number {
  const words1 = new Set(text1.split(/\s+/));
  const words2 = new Set(text2.split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
}

export function isTimeOrPlaceExpiry(text: string): boolean {
  const timePatterns = ['am', 'pm', 'time', 'expiry', 'expire', 'address', 'insured', 'standard time'];
  const lowerText = text.toLowerCase();
  return timePatterns.some(pattern => lowerText.includes(pattern));
}

export function compareTimePatterns(text1: string, text2: string): number {
  // Extract key time/place components
  const extractKeyInfo = (text: string) => {
    const lower = text.toLowerCase();
    return {
      hasTime: /\d+:\d+/.test(lower),
      hasAM: lower.includes('am'),
      hasPM: lower.includes('pm'),
      hasStandardTime: lower.includes('standard time'),
      hasAddress: lower.includes('address'),
      hasInsured: lower.includes('insured'),
      hasNamed: lower.includes('named')
    };
  };
  
  const info1 = extractKeyInfo(text1);
  const info2 = extractKeyInfo(text2);
  
  let matches = 0;
  let total = 0;
  
  Object.keys(info1).forEach(key => {
    total++;
    if (info1[key as keyof typeof info1] === info2[key as keyof typeof info2]) {
      matches++;
    }
  });
  
  return total > 0 ? matches / total : 0;
}

// ===================================
// DATE MATCHING UTILITIES  
// ===================================

export function areDatesEqual(val1: string, val2: string): { isDate: boolean; match: boolean } {
  const date1 = parseFlexibleDate(val1);
  const date2 = parseFlexibleDate(val2);
  
  if (!date1 || !date2) {
    return { isDate: false, match: false };
  }
  
  // Compare normalized dates
  const match = date1.getTime() === date2.getTime();
  return { isDate: true, match: match };
}

export function parseFlexibleDate(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  
  const cleaned = dateStr.trim();
  
  // Try standard Date parsing first
  let date = new Date(cleaned);
  if (!isNaN(date.getTime())) return date;
  
  // Parse common date formats - ENHANCED for better matching
  const formats = [
    // MM/DD/YYYY or MM-DD-YYYY
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
    // DD/MM/YYYY or DD-MM-YYYY  
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
    // YYYY/MM/DD or YYYY-MM-DD
    /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/,
    // Month DD, YYYY (e.g., "January 15, 2025")
    /^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/,
    // DD Month YYYY (e.g., "15 January 2025")
    /^(\d{1,2})\s+([A-Za-z]+),?\s+(\d{4})$/,
    // Month YYYY (e.g., "January 2025")
    /^([A-Za-z]+)\s+(\d{4})$/,
    // Single digit formats: "1 jan 2025", "1-jan-2025"
    /^(\d{1,2})[\s\-]([A-Za-z]{3,9})[\s\-](\d{4})$/,
    // "jan 1 2025", "jan-1-2025"  
    /^([A-Za-z]{3,9})[\s\-](\d{1,2})[\s\-](\d{4})$/
  ];
  
  const monthNames: Record<string, number> = {
    'january': 0, 'jan': 0,
    'february': 1, 'feb': 1,
    'march': 2, 'mar': 2,
    'april': 3, 'apr': 3,
    'may': 4,
    'june': 5, 'jun': 5,
    'july': 6, 'jul': 6,
    'august': 7, 'aug': 7,
    'september': 8, 'sep': 8, 'sept': 8,
    'october': 9, 'oct': 9,
    'november': 10, 'nov': 10,
    'december': 11, 'dec': 11
  };
  
  // Try each format
  for (const format of formats) {
    const match = cleaned.match(format);
    if (match) {
      try {
        if (format.source.includes('[A-Za-z]')) {
          // Handle month names
          let monthStr: string;
          let dayStr: string;
          let yearStr: string;
          
          if (format.source.includes('([A-Za-z]+)\\s+(\\d{1,2})')) {
            // Month Day Year format
            monthStr = match[1];
            dayStr = match[2];
            yearStr = match[3];
          } else if (format.source.includes('(\\d{1,2})\\s+([A-Za-z]+)')) {
            // Day Month Year format  
            dayStr = match[1];
            monthStr = match[2];
            yearStr = match[3];
          } else if (format.source.includes('(\\d{1,2})[\\s\\-]([A-Za-z]{3,9})[\\s\\-](\\d{4})')) {
            // "1 jan 2025" or "1-jan-2025" format
            dayStr = match[1];
            monthStr = match[2];
            yearStr = match[3];
          } else if (format.source.includes('([A-Za-z]{3,9})[\\s\\-](\\d{1,2})[\\s\\-](\\d{4})')) {
            // "jan 1 2025" or "jan-1-2025" format
            monthStr = match[1];
            dayStr = match[2];
            yearStr = match[3];
          } else {
            monthStr = match[1] || match[2];
            dayStr = '1';
            yearStr = match[2] || match[3];
          }
          
          const month = monthNames[monthStr.toLowerCase()];
          
          if (month !== undefined) {
            const day = parseInt(dayStr || '1');
            const year = parseInt(yearStr);
            date = new Date(year, month, day);
            
            if (!isNaN(date.getTime())) return date;
          }
        } else {
          // Handle numeric dates
          const parts = match.slice(1).map(p => parseInt(p));
          
          if (format.source.startsWith('^(\\d{4})')) {
            // YYYY-MM-DD
            date = new Date(parts[0], parts[1] - 1, parts[2]);
          } else {
            // Try MM/DD/YYYY
            date = new Date(parts[2], parts[0] - 1, parts[1]);
            if (isNaN(date.getTime())) {
              // Try DD/MM/YYYY
              date = new Date(parts[2], parts[1] - 1, parts[0]);
            }
          }
          
          if (!isNaN(date.getTime())) return date;
        }
      } catch (e) {
        continue;
      }
    }
  }
  
  return null;
}

// ===================================
// CURRENCY MATCHING UTILITIES
// ===================================

export function areCurrencyValuesEqual(val1: string, val2: string): { isCurrency: boolean; match: boolean } {
  const currency1 = parseCurrencyValue(val1);
  const currency2 = parseCurrencyValue(val2);
  
  if (!currency1 || !currency2) {
    return { isCurrency: false, match: false };
  }
  
  // Compare numerical values
  const match = Math.abs(currency1.amount - currency2.amount) < 0.01; // Allow for floating point precision
  return { isCurrency: true, match: match };
}

export function parseCurrencyValue(currencyStr: string): { amount: number; currency: string } | null {
  if (!currencyStr || typeof currencyStr !== 'string') return null;
  
  const cleaned = currencyStr.trim();
  
  // Currency patterns to detect
  const currencyPatterns = [
    // $1,000,000 or $1000000 or $1,000,000.00
    /^\$?([0-9]{1,3}(?:,?[0-9]{3})*(?:\.[0-9]{2})?)$/,
    // 1000000 or 1,000,000 (numbers only) - CRITICAL FOR YOUR USE CASE
    /^([0-9]{1,3}(?:,?[0-9]{3})*(?:\.[0-9]{2})?)$/,
    // $1M, $1.5M, $2.5K etc
    /^\$?([0-9]+(?:\.[0-9]+)?)\s*([KMB])?$/i,
    // One Million, Two Thousand etc (basic text numbers)
    /^(one|two|three|four|five|six|seven|eight|nine|ten|hundred|thousand|million|billion)\s*(million|thousand|hundred)?$/i
  ];
  
  for (const pattern of currencyPatterns) {
    const match = cleaned.match(pattern);
    if (match) {
      try {
        let amount = 0;
        
        if (pattern.source.includes('([KMB])')) {
          // Handle K/M/B suffixes
          const num = parseFloat(match[1]);
          const suffix = (match[2] || '').toUpperCase();
          
          switch (suffix) {
            case 'K':
              amount = num * 1000;
              break;
            case 'M':
              amount = num * 1000000;
              break;
            case 'B':
              amount = num * 1000000000;
              break;
            default:
              amount = num;
          }
        } else if (pattern.source.includes('(one|two|')) {
          // Handle text numbers (basic implementation)
          const textNum = match[0].toLowerCase();
          if (textNum.includes('million')) {
            if (textNum.includes('one')) amount = 1000000;
            else if (textNum.includes('two')) amount = 2000000;
            else if (textNum.includes('five')) amount = 5000000;
            else if (textNum.includes('ten')) amount = 10000000;
          } else if (textNum.includes('thousand')) {
            if (textNum.includes('one')) amount = 1000;
            else if (textNum.includes('five')) amount = 5000;
            else if (textNum.includes('ten')) amount = 10000;
          }
        } else {
          // Handle numeric values with commas - THIS FIXES YOUR ISSUE
          const numStr = match[1].replace(/,/g, '');
          amount = parseFloat(numStr);
        }
        
        if (!isNaN(amount)) {
          return { amount, currency: 'USD' };
        }
      } catch (e) {
        continue;
      }
    }
  }
  
  return null;
}

// ===================================
// PERCENTAGE MATCHING UTILITIES
// ===================================

export function arePercentagesEqual(val1: string, val2: string): { isPercentage: boolean; match: boolean } {
  const pct1 = parsePercentageValue(val1);
  const pct2 = parsePercentageValue(val2);
  
  if (!pct1 || !pct2) {
    return { isPercentage: false, match: false };
  }
  
  // Compare numerical values (allow small floating point differences)
  const match = Math.abs(pct1.percentage - pct2.percentage) < 0.001;
  return { isPercentage: true, match: match };
}

export function parsePercentageValue(percentageStr: string): { percentage: number } | null {
  if (!percentageStr || typeof percentageStr !== 'string') return null;
  
  const cleaned = percentageStr.trim().toLowerCase();
  
  const percentagePatterns = [
    // 2.5%, 50%, 0.5%
    /^([0-9]+(?:\.[0-9]+)?)\s*%$/,
    // 0.025, 0.5 (decimal representation where < 1.0 likely means percentage)
    /^(0\.[0-9]+)$/,
    // "2.5 percent", "fifty percent"
    /^([0-9]+(?:\.[0-9]+)?)\s*percent$/,
    // Text percentages (basic)
    /^(zero|one|two|three|four|five|six|seven|eight|nine|ten|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)\s*percent$/
  ];
  
  for (const pattern of percentagePatterns) {
    const match = cleaned.match(pattern);
    if (match) {
      try {
        let percentage = 0;
        
        if (pattern.source.includes('zero|one|')) {
          // Handle text percentages
          const textNum = match[1];
          const textToNumber: Record<string, number> = {
            'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
            'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
            'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50,
            'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90, 'hundred': 100
          };
          percentage = textToNumber[textNum] || 0;
        } else {
          const num = parseFloat(match[1]);
          
          if (pattern.source.includes('%')) {
            // Already a percentage (2.5% → 2.5)
            percentage = num;
          } else if (pattern.source.includes('(0\\.[0-9]+)')) {
            // Decimal representation (0.025 → 2.5%)
            percentage = num * 100;
          } else {
            // Number with "percent" (2.5 percent → 2.5)
            percentage = num;
          }
        }
        
        if (!isNaN(percentage)) {
          return { percentage };
        }
      } catch (e) {
        continue;
      }
    }
  }
  
  return null;
}

// ===================================
// STRING SIMILARITY UTILITIES
// ===================================

export function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

export function levenshteinDistance(str1: string, str2: string): number {
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

// ===================================
// UTILITY FUNCTIONS
// ===================================

export function getMissingText(): string {
  return 'Not Present';
}

export function getDisplayValue(value: string | null | undefined): string {
  return value || getMissingText();
}

export function isCriticalField(fieldName: string): boolean {
  const criticalKeywords = [
    'policy number', 'premium', 'limit', 'deductible', 'retention',
    'coverage', 'insured', 'effective date', 'expiration', 'carrier',
    'endorsement', 'exclusion', 'restriction', 'sublimit', 'aggregate'
  ];
  
  const lowerField = fieldName.toLowerCase();
  return criticalKeywords.some(keyword => lowerField.includes(keyword));
}

export function isCoverageField(fieldName: string): boolean {
  const coverageKeywords = [
    'limit', 'coverage', 'deductible', 'retention', 'premium',
    'sublimit', 'aggregate', 'occurrence', 'per claim'
  ];
  const lowerField = fieldName.toLowerCase();
  return coverageKeywords.some(keyword => lowerField.includes(keyword));
}

export function isEndorsementTable(tableName: string): boolean {
  const endorsementKeywords = [
    'endorsement', 'form', 'policy form', 'coverage form',
    'exclusion', 'limitation', 'restriction'
  ];
  const lowerTable = tableName.toLowerCase();
  return endorsementKeywords.some(keyword => lowerTable.includes(keyword));
}
