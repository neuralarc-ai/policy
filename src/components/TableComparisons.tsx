'use client';

import { useEffect } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { matchTableRows } from '@/lib/documentParser';
import { getComparisonStatus } from '@/lib/documentParser';
import { getMissingText } from '@/lib/semanticMatching';
import { TableRow } from '@/types/document';

export default function TableComparisons() {
  const { comparisonData } = useDocumentStore();

  useEffect(() => {
    // Re-initialize Lucide icons when component updates
    if (typeof window !== 'undefined' && (window as any).lucide) {
      (window as any).lucide.createIcons();
    }
  }, [comparisonData]);

  if (!comparisonData) return null;

  const allTables = new Set([
    ...Object.keys(comparisonData.doc1Fields.tables),
    ...Object.keys(comparisonData.doc2Fields.tables)
  ]);

  if (allTables.size === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
        No table data found in the documents.
      </div>
    );
  }

  // Filter out tables that have no meaningful data
  const tablesToDisplay = Array.from(allTables).filter(tableName => {
    const table1Rows = comparisonData.doc1Fields.tables[tableName] || [];
    const table2Rows = comparisonData.doc2Fields.tables[tableName] || [];
    
    const allColumns = new Set<string>();
    [...table1Rows, ...table2Rows].forEach(row => {
      Object.keys(row.columns).forEach(col => allColumns.add(col));
    });
    
    // Check if the entire table has meaningful data
    return [...table1Rows, ...table2Rows].some(row => 
      Array.from(allColumns).some(col => {
        const value = row.columns[col]?.value || '';
        return value && value.trim() !== '' && value.toLowerCase() !== 'not present';
      })
    );
  });

  const createTableRow = (
    rowNum: number, 
    docLabel: string, 
    currentRow: TableRow | null, 
    compareRow: TableRow | null, 
    columns: string[], 
    tableName: string
  ) => {
    return (
      <tr key={`${tableName}-${rowNum}-${docLabel}`}>
        <td className="row-num">{rowNum}</td>
        <td className="doc-label">{docLabel}</td>
        {columns.map(col => {
          const currentValue = currentRow?.columns[col]?.value || '';
          const compareValue = compareRow?.columns[col]?.value || '';
          const status = getComparisonStatus(currentValue, compareValue, `${tableName} - ${col}`);
          
          let cellClass = 'editable';
          if (!currentValue) {
            cellClass += ' missing-cell';
          } else if (!compareValue) {
            cellClass += ' diff-cell';
          } else if (status === 'match') {
            cellClass += ' match-cell';
          } else if (status === 'ambiguous') {
            cellClass += ' ambiguous-cell';
          } else {
            cellClass += ' diff-cell';
          }
          
          return (
            <td
              key={col}
              className={cellClass}
              data-table={tableName}
              data-row={rowNum}
              data-col={col}
              data-doc={docLabel === 'Doc 1' ? '1' : '2'}
            >
              {currentValue || getMissingText()}
            </td>
          );
        })}
      </tr>
    );
  };

  const createEmptyTableRow = (rowNum: number, docLabel: string, columns: string[]) => {
    return (
      <tr key={`empty-${rowNum}-${docLabel}`}>
        <td className="row-num">{rowNum}</td>
        <td className="doc-label">{docLabel}</td>
        {columns.map(col => (
          <td key={col} className="missing-cell">
            {getMissingText()}
          </td>
        ))}
      </tr>
    );
  };

  return (
    <div id="tables-container">
      {tablesToDisplay.length < allTables.size && (
        <div style={{ 
          textAlign: 'center', 
          padding: '1rem', 
          color: 'var(--text-secondary)',
          fontSize: '0.875rem',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1rem'
        }}>
          ({allTables.size - tablesToDisplay.length} empty table sections hidden)
        </div>
      )}
      
      {tablesToDisplay.map(tableName => {
        const table1Rows = comparisonData.doc1Fields.tables[tableName] || [];
        const table2Rows = comparisonData.doc2Fields.tables[tableName] || [];

        // Get all columns from both tables
        const allColumns = new Set<string>();
        [...table1Rows, ...table2Rows].forEach(row => {
          Object.keys(row.columns).forEach(col => allColumns.add(col));
        });
        const columns = Array.from(allColumns);

        // Check if the entire table has any meaningful data
        const hasAnyMeaningfulData = [...table1Rows, ...table2Rows].some(row => 
          columns.some(col => {
            const value = row.columns[col]?.value || '';
            return value && value.trim() !== '' && value.toLowerCase() !== 'not present';
          })
        );

        // Skip this entire table if it has no meaningful data
        if (!hasAnyMeaningfulData) {
          return null;
        }

        // Match rows intelligently
        const rowMatches = matchTableRows(table1Rows, table2Rows);
        
        // Filter out rows where all columns are "Not Present" on both sides
        const rowsToDisplay = rowMatches.filter(match => {
          if (!match.row1 && !match.row2) return false; // Both rows missing
          
          // Check if all columns in both rows are empty or "Not Present"
          if (match.row1 && match.row2) {
            const hasAnyContent = columns.some(col => {
              const val1 = match.row1!.columns[col]?.value || '';
              const val2 = match.row2!.columns[col]?.value || '';
              return (val1 && val1.trim() !== '' && val1.toLowerCase() !== 'not present') || 
                     (val2 && val2.trim() !== '' && val2.toLowerCase() !== 'not present');
            });
            return hasAnyContent; // Only show if there's some meaningful content
          }
          
          return true; // Show if only one side has data
        });

        // If no rows to display after filtering, don't show the table
        if (rowsToDisplay.length === 0) {
          return null;
        }

        return (
          <div key={tableName} className="comparison-block table-section">
            <div className="block-header">
              <i data-lucide="table"></i>
              <h3>{tableName}</h3>
              <span className="edit-hint">Click any cell to edit</span>
            </div>
            
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Doc</th>
                    {columns.map(col => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rowsToDisplay.map((match, idx) => {
                    const rowNum = idx + 1;
                    const rows = [];
                    
                    // Document 1 Row
                    if (match.row1) {
                      rows.push(createTableRow(rowNum, 'Doc 1', match.row1, match.row2, columns, tableName));
                    } else {
                      rows.push(createEmptyTableRow(rowNum, 'Doc 1', columns));
                    }
                    
                    // Document 2 Row
                    if (match.row2) {
                      rows.push(createTableRow(rowNum, 'Doc 2', match.row2, match.row1, columns, tableName));
                    } else {
                      rows.push(createEmptyTableRow(rowNum, 'Doc 2', columns));
                    }
                    
                    return rows;
                  }).flat()}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}