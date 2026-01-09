import { 
  DocumentFile, 
  ParsedFields, 
  TableRow, 
  ComparisonStats, 
  ComparisonStatus, 
  TableRowMatch,
  RawField,
  FieldData
} from '@/types/document';
import { 
  areValuesSemanticallyEqual, 
  calculateStringSimilarity,
  getMissingText,
  shouldIgnoreField
} from '@/lib/semanticMatching';

// ===================================
// DOCUMENT PARSING
// ===================================

export function parseFields(fieldList: RawField[]): ParsedFields {
  const headers: Record<string, FieldData> = {};
  const tables: Record<string, TableRow[]> = {};
  
  fieldList.forEach(field => {
    const fieldName = field.fieldname;
    const rowId = parseInt(field.rowid);
    
    const isTable = fieldList.filter(f => f.fieldname === fieldName).length > 1;
    
    if (isTable) {
      if (!tables[fieldName]) {
        tables[fieldName] = [];
      }
      
      let row = tables[fieldName].find(r => r.rowid === rowId);
      if (!row) {
        row = { rowid: rowId, columns: {} };
        tables[fieldName].push(row);
      }
      
      row.columns[field.columnname] = {
        value: field.extracteddata,
        confidence: field.confidencescore,
        flag: field.confidenceflag
      };
    } else {
      if (rowId === 1) {
        headers[fieldName] = {
          value: field.extracteddata,
          confidence: field.confidencescore,
          flag: field.confidenceflag
        };
      }
    }
  });
  
  // Sort table rows by rowid
  Object.keys(tables).forEach(tableName => {
    tables[tableName].sort((a, b) => a.rowid - b.rowid);
  });
  
  return { headers, tables };
}

// ===================================
// COMPARISON LOGIC
// ===================================

export function getComparisonStatus(val1: string, val2: string, fieldName: string): ComparisonStatus {
  const semanticResult = areValuesSemanticallyEqual(val1, val2);
  
  if (semanticResult.match === true || semanticResult.match === 'ambiguous') {
    // Treat both exact matches and ambiguous matches as matches
    return 'match';
  } else if (!val1 || !val2) {
    return 'missing';
  } else {
    return 'diff';
  }
}

export function calculateStats(doc1Fields: ParsedFields, doc2Fields: ParsedFields): ComparisonStats {
  let matches = 0;
  let diffs = 0;
  let missing = 0;
  let total = 0;
  
  // Calculate header field stats
  const allHeaderFields = new Set([
    ...Object.keys(doc1Fields.headers),
    ...Object.keys(doc2Fields.headers)
  ]);
  
  allHeaderFields.forEach(fieldName => {
    // Skip ignored administrative fields
    if (shouldIgnoreField(fieldName)) {
      return;
    }
    
    const value1 = doc1Fields.headers[fieldName]?.value || '';
    const value2 = doc2Fields.headers[fieldName]?.value || '';
    
    // Skip fields where both sides are empty (Not Present on both sides)
    if ((!value1 || value1.trim() === '') && (!value2 || value2.trim() === '')) {
      return; // Don't count these fields
    }
    
    total++;
    const status = getComparisonStatus(value1, value2, fieldName);
    
    if (!doc1Fields.headers[fieldName] || !doc2Fields.headers[fieldName]) {
      missing++;
    } else if (status === 'match') {
      matches++;
    } else {
      diffs++;
    }
  });
  
  // Calculate table field stats
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
          total++;
          const val1 = row1.columns[col]?.value || '';
          const val2 = row2.columns[col]?.value || '';
          
          const status = getComparisonStatus(val1, val2, `${tableName} - ${col}`);
          
          if (!val1 || !val2) {
            missing++;
          } else if (status === 'match') {
            matches++;
          } else {
            diffs++;
          }
        });
      }
    }
  });
  
  return { matches, diffs, missing, total };
}

// ===================================
// TABLE ROW MATCHING
// ===================================

export function matchTableRows(table1: TableRow[], table2: TableRow[]): TableRowMatch[] {
  const matches: TableRowMatch[] = [];
  const unmatchedTable1 = [...table1];
  const unmatchedTable2 = [...table2];
  
  // First pass: Try to match rows by content similarity with improved thresholds
  table1.forEach((row1, idx1) => {
    let bestMatch: TableRow | null = null;
    let bestScore = 0;
    let bestIdx = -1;
    
    unmatchedTable2.forEach((row2, idx2) => {
      const score = calculateRowSimilarity(row1, row2);
      // Lowered threshold from 0.7 to 0.4 for better insurance coverage matching
      if (score > bestScore && score > 0.4) { 
        bestScore = score;
        bestMatch = row2;
        bestIdx = idx2;
      }
    });
    
    if (bestMatch) {
      matches.push({
        row1: row1,
        row2: bestMatch,
        matchType: 'content',
        similarity: bestScore
      });
      unmatchedTable1.splice(unmatchedTable1.indexOf(row1), 1);
      unmatchedTable2.splice(bestIdx, 1);
    }
  });
  
  // Second pass: Match remaining rows by position
  const remaining = Math.min(unmatchedTable1.length, unmatchedTable2.length);
  for (let i = 0; i < remaining; i++) {
    matches.push({
      row1: unmatchedTable1[i],
      row2: unmatchedTable2[i],
      matchType: 'position',
      similarity: 0
    });
  }
  
  // Add unmatched rows
  unmatchedTable1.slice(remaining).forEach(row => {
    matches.push({
      row1: row,
      row2: null,
      matchType: 'unmatched',
      similarity: 0
    });
  });
  
  unmatchedTable2.slice(remaining).forEach(row => {
    matches.push({
      row1: null,
      row2: row,
      matchType: 'unmatched',
      similarity: 0
    });
  });
  
  return matches;
}

export function calculateRowSimilarity(row1: TableRow, row2: TableRow): number {
  const columns1 = Object.keys(row1.columns);
  const columns2 = Object.keys(row2.columns);
  
  // Get common columns
  const commonColumns = columns1.filter(col => columns2.includes(col));
  if (commonColumns.length === 0) return 0;
  
  let totalSimilarity = 0;
  let comparedColumns = 0;
  
  // Focus on key columns that typically contain coverage names/descriptions
  const keyColumns = commonColumns.filter(col => 
    col.toLowerCase().includes('description') ||
    col.toLowerCase().includes('coverage') ||
    col.toLowerCase().includes('name') ||
    col.toLowerCase().includes('type') ||
    col.toLowerCase().includes('form')
  );
  
  // If we have key columns, prioritize them
  const columnsToCheck = keyColumns.length > 0 ? keyColumns : commonColumns;
  
  columnsToCheck.forEach(col => {
    const val1 = row1.columns[col]?.value || '';
    const val2 = row2.columns[col]?.value || '';
    
    if (val1 || val2) {
      const matchResult = areValuesSemanticallyEqual(val1, val2);
      if (matchResult.match === true) {
        // Give higher weight to key columns
        const weight = keyColumns.includes(col) ? 2 : 1;
        totalSimilarity += weight;
        comparedColumns += weight;
      } else if (matchResult.match === 'ambiguous') {
        const weight = keyColumns.includes(col) ? 2 : 1;
        const similarity = matchResult.similarity || 0.5;
        totalSimilarity += (similarity * weight);
        comparedColumns += weight;
      } else {
        // Check for partial matches in coverage names
        const partialMatch = calculateCoverageNameSimilarity(val1, val2);
        if (partialMatch > 0.3) {
          const weight = keyColumns.includes(col) ? 2 : 1;
          totalSimilarity += (partialMatch * weight);
          comparedColumns += weight;
        } else {
          comparedColumns += (keyColumns.includes(col) ? 2 : 1);
        }
      }
    }
  });
  
  return comparedColumns > 0 ? totalSimilarity / comparedColumns : 0;
}

// New function to calculate similarity for insurance coverage names
export function calculateCoverageNameSimilarity(name1: string, name2: string): number {
  if (!name1 || !name2) return 0;
  
  const normalize = (text: string) => text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const norm1 = normalize(name1);
  const norm2 = normalize(name2);
  
  // Check for common insurance coverage keywords
  const keywords1 = norm1.split(' ');
  const keywords2 = norm2.split(' ');
  
  // Find common keywords
  const commonKeywords = keywords1.filter(word => 
    keywords2.includes(word) && word.length > 2 // ignore short words
  );
  
  const totalKeywords = new Set([...keywords1, ...keywords2]).size;
  
  if (totalKeywords === 0) return 0;
  
  return commonKeywords.length / totalKeywords;
}

// ===================================
// SMART TABLE ROW MATCHING BY CONTEXT
// ===================================

export function matchTableRowsByContext(
  table1: Record<string, string>[],
  table2: Record<string, string>[],
  columns: string[]
): TableRowMatch[] {
  if (table1.length === 0 && table2.length === 0) return [];
  
  const matches: TableRowMatch[] = [];
  const used2 = new Set<number>();
  
  // Find description/name column (common identifiers)
  const descColumns = columns.filter(col => 
    col.toLowerCase().includes('description') ||
    col.toLowerCase().includes('name') ||
    col.toLowerCase().includes('item') ||
    col.toLowerCase().includes('coverage') ||
    col.toLowerCase().includes('form') ||
    col.toLowerCase().includes('endorsement')
  );
  
  // Match rows by description similarity
  table1.forEach((row1, rowIndex) => {
    let bestMatch: Record<string, string> | null = null;
    let bestScore = 0;
    let bestIdx = -1;
    
    table2.forEach((row2, idx2) => {
      if (used2.has(idx2)) return;
      
      // Calculate similarity based on all columns, prioritizing description columns
      let score = 0;
      let totalWeight = 0;
      
      columns.forEach(col => {
        const val1 = row1[col] || '';
        const val2 = row2[col] || '';
        
        if (!val1 && !val2) return;
        
        const weight = descColumns.includes(col) ? 3 : 1; // Description columns weighted 3x
        const matchResult = areValuesSemanticallyEqual(val1, val2);
        
        if (matchResult.match) {
          score += weight;
        }
        totalWeight += weight;
      });
      
      const normalizedScore = totalWeight > 0 ? score / totalWeight : 0;
      
      if (normalizedScore > bestScore) {
        bestScore = normalizedScore;
        bestMatch = row2;
        bestIdx = idx2;
      }
    });
    
    // Match if similarity > 50%
    if (bestMatch && bestScore > 0.5) {
      used2.add(bestIdx);
      
      // Compare each column
      const columnStatus: Record<string, ComparisonStatus> = {};
      columns.forEach(col => {
        const val1 = row1[col] || '';
        const val2 = bestMatch![col] || '';
        
        if (!val1 && !val2) {
          columnStatus[col] = 'match';
        } else if (!val1 || !val2) {
          columnStatus[col] = 'missing';
        } else {
          const matchResult = areValuesSemanticallyEqual(val1, val2);
          columnStatus[col] = matchResult.match ? 'match' : 'diff';
        }
      });
      
      // Convert to TableRow format for compatibility
      const tableRow1: TableRow = {
        rowid: rowIndex + 1,
        columns: Object.fromEntries(
          Object.entries(row1).map(([key, value]) => [
            key,
            { value: String(value || ''), confidence: 1, flag: 'high' }
          ])
        )
      };
      
      const tableRow2: TableRow = {
        rowid: bestIdx + 1,
        columns: Object.fromEntries(
          Object.entries(bestMatch).map(([key, value]) => [
            key,
            { value: String(value || ''), confidence: 1, flag: 'high' }
          ])
        )
      };
      
      matches.push({
        row1: tableRow1,
        row2: tableRow2,
        columnStatus: columnStatus,
        matchScore: bestScore
      });
    } else {
      // No good match found - row only in doc1
      const columnStatus: Record<string, ComparisonStatus> = {};
      columns.forEach(col => {
        columnStatus[col] = row1[col] ? 'missing' : 'match';
      });
      
      const tableRow1: TableRow = {
        rowid: rowIndex + 1,
        columns: Object.fromEntries(
          Object.entries(row1).map(([key, value]) => [
            key,
            { value: String(value || ''), confidence: 1, flag: 'high' }
          ])
        )
      };
      
      matches.push({
        row1: tableRow1,
        row2: null,
        columnStatus: columnStatus,
        matchScore: 0
      });
    }
  });
  
  // Add unmatched rows from table2
  table2.forEach((row2, idx2) => {
    if (!used2.has(idx2)) {
      const columnStatus: Record<string, ComparisonStatus> = {};
      columns.forEach(col => {
        columnStatus[col] = row2[col] ? 'missing' : 'match';
      });
      
      const tableRow2: TableRow = {
        rowid: idx2 + 1,
        columns: Object.fromEntries(
          Object.entries(row2).map(([key, value]) => [
            key,
            { value: String(value || ''), confidence: 1, flag: 'high' }
          ])
        )
      };
      
      matches.push({
        row1: null,
        row2: tableRow2,
        columnStatus: columnStatus,
        matchScore: 0
      });
    }
  });
  
  return matches;
}
