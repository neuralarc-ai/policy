import { 
  DocumentFile, 
  ParsedFields, 
  ComparisonStats, 
  ComparisonStatus, 
  ComparisonData
} from '@/types/document';
import { parseFields, calculateStats, getComparisonStatus } from './documentParser';
import { EnhancedSemanticMatcher, EnhancedMatchResult } from './enhancedSemanticMatching';
import { config } from './config';

let globalEnhancedMatcher: EnhancedSemanticMatcher | null = null;

/**
 * Initialize the enhanced matcher with Gemini API
 */
export function initializeEnhancedMatcher(): void {
  if (!globalEnhancedMatcher) {
    globalEnhancedMatcher = new EnhancedSemanticMatcher(config.gemini.apiKey);
    
    if (config.comparison.enableDebugLogging) {
      console.log('🚀 Enhanced semantic matcher initialized:', globalEnhancedMatcher.getStatus());
    }
  }
}

/**
 * Process document comparison with enhanced semantic matching
 */
export async function processDocumentComparisonAsync(
  doc1: DocumentFile,
  doc2: DocumentFile
): Promise<ComparisonData> {
  
  console.log('📊 Starting enhanced document comparison...');
  const startTime = Date.now();
  
  // Parse fields (same as before)
  const doc1Fields = parseFields(doc1.fieldList);
  const doc2Fields = parseFields(doc2.fieldList);
  
  // Initialize enhanced matcher if not done
  if (!globalEnhancedMatcher) {
    initializeEnhancedMatcher();
  }
  
  // Collect all field comparisons that need to be done
  const comparisonTasks: Array<{
    val1: string;
    val2: string;
    fieldName: string;
    type: 'header' | 'table';
    tableName?: string;
    columnName?: string;
  }> = [];
  
  // Collect header fields
  const allHeaderFields = new Set([
    ...Object.keys(doc1Fields.headers),
    ...Object.keys(doc2Fields.headers)
  ]);
  
  allHeaderFields.forEach(fieldName => {
    const val1 = doc1Fields.headers[fieldName]?.value || '';
    const val2 = doc2Fields.headers[fieldName]?.value || '';
    
    comparisonTasks.push({
      val1,
      val2,
      fieldName,
      type: 'header'
    });
  });
  
  // Collect table fields
  const allTables = new Set([
    ...Object.keys(doc1Fields.tables),
    ...Object.keys(doc2Fields.tables)
  ]);
  
  allTables.forEach(tableName => {
    const table1Rows = doc1Fields.tables[tableName] || [];
    const table2Rows = doc2Fields.tables[tableName] || [];
    const maxRows = Math.max(table1Rows.length, table2Rows.length);
    
    for (let i = 0; i < maxRows; i++) {
      const row1 = table1Rows[i];
      const row2 = table2Rows[i];
      
      if (row1 && row2) {
        const allColumns = new Set([
          ...Object.keys(row1.columns),
          ...Object.keys(row2.columns)
        ]);
        
        allColumns.forEach(col => {
          const val1 = row1.columns[col]?.value || '';
          const val2 = row2.columns[col]?.value || '';
          
          comparisonTasks.push({
            val1,
            val2,
            fieldName: `${tableName} - ${col}`,
            type: 'table',
            tableName,
            columnName: col
          });
        });
      }
    }
  });
  
  console.log(`🔍 Processing ${comparisonTasks.length} field comparisons...`);
  
  // Process comparisons in batches for better performance
  const comparisonResults = globalEnhancedMatcher 
    ? await globalEnhancedMatcher.compareBatch(comparisonTasks)
    : comparisonTasks.map(task => globalEnhancedMatcher!.compareFieldsSync(task.val1, task.val2, task.fieldName));
  
  // Calculate enhanced statistics
  let matches = 0;
  let diffs = 0;
  let missing = 0;
  let ambiguous = 0;
  let aiMatches = 0;
  let ruleBasedMatches = 0;
  
  comparisonResults.forEach(result => {
    if (result.match === true) {
      matches++;
      if (result.source === 'gemini') aiMatches++;
      else ruleBasedMatches++;
    } else if (result.match === 'ambiguous') {
      ambiguous++;
    } else if (comparisonTasks[comparisonResults.indexOf(result)].val1 && 
               comparisonTasks[comparisonResults.indexOf(result)].val2) {
      diffs++;
    } else {
      missing++;
    }
  });
  
  const processingTime = Date.now() - startTime;
  
  if (config.comparison.enableDebugLogging) {
    console.log('📈 Enhanced comparison complete:', {
      totalFields: comparisonTasks.length,
      matches,
      differences: diffs,
      missing,
      ambiguous,
      aiMatches,
      ruleBasedMatches,
      processingTimeMs: processingTime,
      geminiEnabled: config.gemini.enabled
    });
  }
  
  // Create enhanced comparison data
  const enhancedStats: ComparisonStats & {
    ambiguous?: number;
    aiMatches?: number;
    ruleBasedMatches?: number;
    processingTimeMs?: number;
  } = {
    matches,
    diffs,
    missing,
    total: comparisonTasks.length,
    ambiguous,
    aiMatches,
    ruleBasedMatches,
    processingTimeMs: processingTime
  };
  
  return {
    doc1,
    doc2,
    doc1Fields,
    doc2Fields,
    stats: enhancedStats
  };
}

/**
 * Get enhanced comparison status for a field
 */
export async function getEnhancedComparisonStatus(
  val1: string, 
  val2: string, 
  fieldName: string
): Promise<ComparisonStatus> {
  if (!globalEnhancedMatcher) {
    initializeEnhancedMatcher();
  }
  
  if (!globalEnhancedMatcher) {
    // Fallback to sync version
    return getComparisonStatus(val1, val2, fieldName);
  }
  
  const result = await globalEnhancedMatcher.compareFieldsEnhanced(val1, val2, fieldName);
  
  if (result.match === true) {
    return 'match';
  } else if (result.match === 'ambiguous') {
    return 'ambiguous';
  } else if (!val1 || !val2) {
    return 'missing';
  } else {
    return 'diff';
  }
}

/**
 * Synchronous version for backward compatibility
 */
export function getEnhancedComparisonStatusSync(
  val1: string, 
  val2: string, 
  fieldName: string
): ComparisonStatus {
  if (!globalEnhancedMatcher) {
    initializeEnhancedMatcher();
  }
  
  if (!globalEnhancedMatcher) {
    return getComparisonStatus(val1, val2, fieldName);
  }
  
  const result = globalEnhancedMatcher.compareFieldsSync(val1, val2, fieldName);
  
  if (result.match === true) {
    return 'match';
  } else if (result.match === 'ambiguous') {
    return 'ambiguous';
  } else if (!val1 || !val2) {
    return 'missing';
  } else {
    return 'diff';
  }
}
