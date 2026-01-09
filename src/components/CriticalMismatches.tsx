'use client';

import { useDocumentStore } from '@/store/documentStore';
import { areValuesSemanticallyEqual, isCriticalField, getDisplayValue, shouldIgnoreField } from '@/lib/semanticMatching';
import { CriticalMismatch } from '@/types/document';
import { useMemo } from 'react';

export default function CriticalMismatches() {
  const { comparisonData } = useDocumentStore();

  const mismatches = useMemo(() => {
    if (!comparisonData) return [];

    const results: CriticalMismatch[] = [];
    const { doc1Fields, doc2Fields } = comparisonData;

    // Collect all mismatches from headers
    const allHeaderFields = new Set([
      ...Object.keys(doc1Fields.headers), 
      ...Object.keys(doc2Fields.headers)
    ]);
    
    allHeaderFields.forEach(fieldName => {
      // Skip ignored administrative fields
      if (shouldIgnoreField(fieldName)) {
        return;
      }
      
      const val1 = doc1Fields.headers[fieldName]?.value || '';
      const val2 = doc2Fields.headers[fieldName]?.value || '';
      
      // Skip fields where both sides are empty (Not Present on both sides)
      if ((!val1 || val1.trim() === '') && (!val2 || val2.trim() === '')) {
        return; // Skip this field
      }
      
      const matchResult = areValuesSemanticallyEqual(val1, val2);
      
      // Only show as mismatch if it's a clear non-match (treat ambiguous as matches)
      if (matchResult.match === false) {
        results.push({
          fieldName,
          value1: getDisplayValue(val1),
          value2: getDisplayValue(val2),
          type: 'header',
          isCritical: isCriticalField(fieldName),
          isAmbiguous: false
        });
      }
      // Removed: ambiguous matches are now treated as regular matches
    });

    // Sort by criticality
    results.sort((a, b) => {
      if (a.isCritical && !b.isCritical) return -1;
      if (!a.isCritical && b.isCritical) return 1;
      if (a.isAmbiguous && !b.isAmbiguous) return -1;
      if (!a.isAmbiguous && b.isAmbiguous) return 1;
      return 0;
    });

    return results;
  }, [comparisonData]);

  if (!comparisonData) return null;

  return (
    <div className="critical-section">
      <div className="critical-header">
        <i data-lucide="alert-triangle"></i>
        <h2>Critical Mismatches</h2>
        <span className="critical-count">{mismatches.length}</span>
      </div>
      
      <div className="critical-list">
        {mismatches.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem', 
            color: 'var(--color-match-border)', 
            fontWeight: '600', 
            fontSize: '1.125rem' 
          }}>
            <i data-lucide="check-circle-2" style={{ 
              width: '32px', 
              height: '32px', 
              marginBottom: '0.5rem',
              display: 'block',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}></i>
            <br />✓ No critical mismatches found - All key fields match!
          </div>
        ) : (
          mismatches.map((item, index) => (
            <div
              key={index}
              className={`critical-item ${item.isAmbiguous ? 'ambiguous' : ''}`}
            >
              <div className="critical-item-icon">
                <i data-lucide={item.isAmbiguous ? 'help-circle' : item.isCritical ? 'alert-circle' : 'info'}></i>
              </div>
              <div className="critical-item-field">
                <div className="critical-item-label">
                  {item.fieldName}
                  {item.isAmbiguous && (
                    <span className="ambiguous-badge">NEEDS REVIEW</span>
                  )}
                </div>
              </div>
              <div className="critical-item-values">
                <div className="critical-value">
                  <div className="critical-value-label">Document 1</div>
                  <div className="critical-value-text">{item.value1}</div>
                </div>
                <div className="critical-value">
                  <div className="critical-value-label">Document 2</div>
                  <div className="critical-value-text">{item.value2}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}