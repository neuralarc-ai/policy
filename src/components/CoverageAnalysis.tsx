'use client';

import { useDocumentStore } from '@/store/documentStore';

// Commented out imports for disabled functionality
// import { isCoverageField, getDisplayValue } from '@/lib/semanticMatching';
// import { getEnhancedComparisonStatusSync } from '@/lib/asyncDocumentParser';
// import { useMemo } from 'react';

/*
interface CoverageChange {
  fieldName: string;
  value1: string;
  value2: string;
  type: 'increase' | 'restriction';
  impact: string;
}
*/

export default function CoverageAnalysis() {
  const { comparisonData } = useDocumentStore();

  // Coverage Impact Analysis logic commented out
  /*
  const coverageChanges = useMemo(() => {
    if (!comparisonData) return [];

    const changes: CoverageChange[] = [];
    const { doc1Fields, doc2Fields } = comparisonData;

    // Analyze all header fields for coverage-related changes
    const allFields = new Set([
      ...Object.keys(doc1Fields.headers), 
      ...Object.keys(doc2Fields.headers)
    ]);

    allFields.forEach(fieldName => {
      const val1 = doc1Fields.headers[fieldName]?.value || '';
      const val2 = doc2Fields.headers[fieldName]?.value || '';

      const status = getEnhancedComparisonStatusSync(val1, val2, fieldName);

      if (isCoverageField(fieldName) && status !== 'match') {
        const change = analyzeCoverageChange(fieldName, val1, val2);
        if (change) {
          changes.push(change);
        }
      }
    });

    return changes;
  }, [comparisonData]);
  */

  if (!comparisonData) return null;

  // Coverage Impact Analysis section commented out
  return null;

  /* 
  return (
    <div className="coverage-section">
      <div className="coverage-header">
        <i data-lucide="shield-alert"></i>
        <h3>Coverage Impact Analysis</h3>
      </div>
      
      <div className="coverage-grid">
        {coverageChanges.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
            No coverage changes detected
          </div>
        ) : (
          coverageChanges.map((change, index) => (
            <div
              key={index}
              className={`coverage-item ${change.type}`}
            >
              <div className="coverage-item-title">
                <i data-lucide={change.type === 'increase' ? 'trending-up' : 'trending-down'}></i>
                {change.fieldName}
              </div>
              <div className="coverage-item-detail">
                <strong>Document 1:</strong> {change.value1}<br />
                <strong>Document 2:</strong> {change.value2}<br />
                <strong>Impact:</strong> {change.impact}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
  */
}

/*
function analyzeCoverageChange(fieldName: string, val1: string, val2: string): CoverageChange | null {
  const num1 = parseFloat(val1.replace(/[^0-9.-]/g, ''));
  const num2 = parseFloat(val2.replace(/[^0-9.-]/g, ''));
  
  let type: 'increase' | 'restriction' = 'restriction';
  let impact = '';
  
  if (!isNaN(num1) && !isNaN(num2)) {
    if (num2 > num1) {
      type = 'increase';
      impact = `Coverage increased by ${((num2 - num1) / num1 * 100).toFixed(1)}%`;
    } else if (num2 < num1) {
      type = 'restriction';
      impact = `Coverage decreased by ${((num1 - num2) / num1 * 100).toFixed(1)}%`;
    } else {
      return null; // No change
    }
  } else {
    // Qualitative analysis
    const restrictionKeywords = ['exclude', 'not covered', 'limitation', 'restrict', 'reduce'];
    const increaseKeywords = ['include', 'add', 'extend', 'increase', 'enhance'];
    
    const val2Lower = val2.toLowerCase();
    
    if (restrictionKeywords.some(kw => val2Lower.includes(kw))) {
      type = 'restriction';
      impact = 'Coverage may be restricted or limited';
    } else if (increaseKeywords.some(kw => val2Lower.includes(kw))) {
      type = 'increase';
      impact = 'Coverage may be enhanced or extended';
    } else {
      impact = 'Coverage terms have changed';
    }
  }
  
  return {
    fieldName,
    value1: val1 || getDisplayValue(val1),
    value2: val2 || getDisplayValue(val2),
    type,
    impact
  };
}
*/