'use client';

import { useState, useEffect } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { getEnhancedComparisonStatusSync } from '@/lib/asyncDocumentParser';
import { getMissingText, shouldIgnoreField } from '@/lib/semanticMatching';

export default function HeaderComparison() {
  const { comparisonData, setComparisonData, addEditHistory } = useDocumentStore();
  const [editingField, setEditingField] = useState<{field: string; doc: 1 | 2} | null>(null);

  useEffect(() => {
    // Re-initialize Lucide icons when component updates
    if (typeof window !== 'undefined' && (window as any).lucide) {
      (window as any).lucide.createIcons();
    }
  }, [comparisonData]);

  if (!comparisonData) return null;

  const allFields = new Set([
    ...Object.keys(comparisonData.doc1Fields.headers),
    ...Object.keys(comparisonData.doc2Fields.headers)
  ]);

  // Filter out fields where both sides are "Not Present" and ignored administrative fields
  const fieldsToDisplay = Array.from(allFields).filter(fieldName => {
    // Skip ignored administrative fields
    if (shouldIgnoreField(fieldName)) {
      return false;
    }
    
    const value1 = comparisonData.doc1Fields.headers[fieldName]?.value || '';
    const value2 = comparisonData.doc2Fields.headers[fieldName]?.value || '';
    
    // Skip if both values are empty/missing
    return !((!value1 || value1.trim() === '') && (!value2 || value2.trim() === ''));
  });

  const handleEdit = (fieldName: string, docNum: 1 | 2, newValue: string) => {
    const oldValue = docNum === 1 
      ? comparisonData.doc1Fields.headers[fieldName]?.value || ''
      : comparisonData.doc2Fields.headers[fieldName]?.value || '';

    // Update the data
    const updatedData = { ...comparisonData };
    if (docNum === 1) {
      if (!updatedData.doc1Fields.headers[fieldName]) {
        updatedData.doc1Fields.headers[fieldName] = { value: '', confidence: 1, flag: 'high' };
      }
      updatedData.doc1Fields.headers[fieldName].value = newValue;
    } else {
      if (!updatedData.doc2Fields.headers[fieldName]) {
        updatedData.doc2Fields.headers[fieldName] = { value: '', confidence: 1, flag: 'high' };
      }
      updatedData.doc2Fields.headers[fieldName].value = newValue;
    }

    setComparisonData(updatedData);

    // Log the edit
    addEditHistory({
      timestamp: new Date().toISOString(),
      field: fieldName,
      document: docNum.toString(),
      oldValue,
      newValue
    });

    setEditingField(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent, fieldName: string, docNum: 1 | 2) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLInputElement;
      handleEdit(fieldName, docNum, target.value);
    }
    if (e.key === 'Escape') {
      setEditingField(null);
    }
  };

  const getFieldValue = (fieldName: string, docNum: 1 | 2) => {
    const field = docNum === 1 
      ? comparisonData.doc1Fields.headers[fieldName]
      : comparisonData.doc2Fields.headers[fieldName];
    return field?.value || '';
  };

  const getFieldStatus = (fieldName: string, docNum: 1 | 2) => {
    const value1 = comparisonData.doc1Fields.headers[fieldName]?.value || '';
    const value2 = comparisonData.doc2Fields.headers[fieldName]?.value || '';
    
    const status = getEnhancedComparisonStatusSync(value1, value2, fieldName);
    
    if (docNum === 1 && !comparisonData.doc1Fields.headers[fieldName]) return 'missing';
    if (docNum === 2 && !comparisonData.doc2Fields.headers[fieldName]) return 'missing';
    
    return status;
  };

  const enableEdit = (fieldName: string, docNum: 1 | 2) => {
    setEditingField({ field: fieldName, doc: docNum });
  };

  return (
    <div className="comparison-block">
      <div className="block-header">
        <i data-lucide="file-text"></i>
        <h3>Header Fields Comparison</h3>
        <span className="edit-hint">Click any value to edit</span>
        {fieldsToDisplay.length < Array.from(allFields).length && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginLeft: '1rem' }}>
            ({Array.from(allFields).length - fieldsToDisplay.length} empty fields hidden)
          </span>
        )}
      </div>
      
      <div className="side-by-side-container">
        {/* Document 1 Column */}
        <div className="document-column">
          <div className="column-header">Document 1</div>
          <div className="field-list">
            {fieldsToDisplay.map(fieldName => {
              const value = getFieldValue(fieldName, 1);
              const status = getFieldStatus(fieldName, 1);
              const isEditing = editingField?.field === fieldName && editingField?.doc === 1;
              
              return (
                <div key={`${fieldName}-1`} className="field-item">
                  <div className="field-item-name">{fieldName}</div>
                  <div 
                    className={`field-item-value ${status} editable ${isEditing ? 'editing' : ''}`}
                    data-field={fieldName}
                    data-doc="1"
                    onClick={() => !isEditing && enableEdit(fieldName, 1)}
                  >
                    {isEditing ? (
                      <input
                        type="text"
                        defaultValue={value}
                        onBlur={(e) => handleEdit(fieldName, 1, e.target.value)}
                        onKeyDown={(e) => handleKeyPress(e, fieldName, 1)}
                        autoFocus
                      />
                    ) : (
                      value || getMissingText()
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Document 2 Column */}
        <div className="document-column">
          <div className="column-header">Document 2</div>
          <div className="field-list">
            {fieldsToDisplay.map(fieldName => {
              const value = getFieldValue(fieldName, 2);
              const status = getFieldStatus(fieldName, 2);
              const isEditing = editingField?.field === fieldName && editingField?.doc === 2;
              
              return (
                <div key={`${fieldName}-2`} className="field-item">
                  <div className="field-item-name">{fieldName}</div>
                  <div 
                    className={`field-item-value ${status} editable ${isEditing ? 'editing' : ''}`}
                    data-field={fieldName}
                    data-doc="2"
                    onClick={() => !isEditing && enableEdit(fieldName, 2)}
                  >
                    {isEditing ? (
                      <input
                        type="text"
                        defaultValue={value}
                        onBlur={(e) => handleEdit(fieldName, 2, e.target.value)}
                        onKeyDown={(e) => handleKeyPress(e, fieldName, 2)}
                        autoFocus
                      />
                    ) : (
                      value || getMissingText()
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}