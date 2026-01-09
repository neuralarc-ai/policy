'use client';

import { useMemo } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { getEnhancedComparisonStatusSync } from '@/lib/asyncDocumentParser';

interface LetterModalProps {
  onClose: () => void;
}

export default function LetterModal({ onClose }: LetterModalProps) {
  const { comparisonData } = useDocumentStore();

  const letterContent = useMemo(() => {
    if (!comparisonData) return null;

    const today = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    const doc1Name = comparisonData.doc1.fileName;
    const doc2Name = comparisonData.doc2.fileName;
    const stats = comparisonData.stats;
    
    // Get header differences
    const headerDiffs: Array<{field: string; value1: string; value2: string; type: string}> = [];
    const headers1 = comparisonData.doc1Fields.headers;
    const headers2 = comparisonData.doc2Fields.headers;
    
    Object.keys(headers1).forEach(fieldName => {
      const val1 = headers1[fieldName]?.value || '';
      const val2 = headers2[fieldName]?.value || '';
      
      if (!headers2[fieldName]) {
        headerDiffs.push({
          field: fieldName,
          value1: val1,
          value2: 'Not Present',
          type: 'missing'
        });
      } else {
        const status = getEnhancedComparisonStatusSync(val1, val2, fieldName);
        if (status !== 'match') {
          headerDiffs.push({
            field: fieldName,
            value1: val1,
            value2: val2,
            type: 'difference'
          });
        }
      }
    });

    return {
      today,
      doc1Name,
      doc2Name,
      stats,
      headerDiffs
    };
  }, [comparisonData]);

  const handleDownload = () => {
    if (!letterContent || !comparisonData) return;

    const fullHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Document Comparison Report</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
        h1 { color: #000; }
        h3 { color: #333; margin-top: 30px; }
        .letter-list { list-style: none; padding: 0; }
        .letter-list li { padding: 10px; margin: 5px 0; border-left: 3px solid #ccc; background: #f5f5f5; }
        .letter-list li.difference { background: #fff3cd; border-color: #ffc107; }
        .letter-list li.missing { background: #f8d7da; border-color: #dc3545; }
        .letter-field-name { font-weight: bold; display: block; margin-bottom: 4px; }
        .letter-field-values { display: flex; gap: 16px; font-size: 13px; }
    </style>
</head>
<body>
    <div class="letter-header">
        <div class="letter-date">${letterContent.today}</div>
        <h1 class="letter-title">Document Comparison Report</h1>
        <p class="letter-subtitle">Analysis of Policy Document Differences</p>
    </div>
    
    <div class="letter-section">
        <h3>Executive Summary</h3>
        <p>This report presents a comprehensive comparison between two insurance policy documents. 
        The analysis identified <strong>${letterContent.stats.diffs} differences</strong>, <strong>${letterContent.stats.missing} fields not present</strong>, 
        and <strong>${letterContent.stats.matches} matching fields</strong> across a total of <strong>${letterContent.stats.total} fields</strong>.</p>
    </div>
    
    <div class="letter-section">
        <h3>Documents Compared</h3>
        <p><strong>Document 1:</strong> ${letterContent.doc1Name}</p>
        <p><strong>Document 2:</strong> ${letterContent.doc2Name}</p>
    </div>

    ${letterContent.headerDiffs.length > 0 ? `
    <div class="letter-section">
        <h3>Header Field Differences</h3>
        <ul class="letter-list">
            ${letterContent.headerDiffs.map(diff => `
            <li class="${diff.type}">
                <span class="letter-field-name">${diff.field}</span>
                <div class="letter-field-values">
                    <span>Doc 1: ${diff.value1}</span>
                    <span>→</span>
                    <span>Doc 2: ${diff.value2}</span>
                </div>
            </li>
            `).join('')}
        </ul>
    </div>
    ` : ''}

    <div class="letter-signature">
        <p><strong>Report Generated:</strong> ${letterContent.today}</p>
        <p><strong>Total Fields Analyzed:</strong> ${letterContent.stats.total}</p>
        <p><strong>Accuracy Rate:</strong> ${((letterContent.stats.matches / letterContent.stats.total) * 100).toFixed(1)}%</p>
    </div>
</body>
</html>
    `;
    
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comparison_report_${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!comparisonData || !letterContent) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        {/* Header */}
        <div className="modal-header">
          <h2>Difference Letter</h2>
          <button onClick={onClose} className="modal-close">
            <i data-lucide="x"></i>
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div className="letter-content">
            {/* Header */}
            <div className="letter-header">
              <div className="letter-date">{letterContent.today}</div>
              <h1 className="letter-title">Document Comparison Report</h1>
              <p className="letter-subtitle">Analysis of Policy Document Differences</p>
            </div>
            
            {/* Executive Summary */}
            <div className="letter-section">
              <h3>Executive Summary</h3>
              <p>
                This report presents a comprehensive comparison between two insurance policy documents. 
                The analysis identified <strong>{letterContent.stats.diffs} differences</strong>, <strong>{letterContent.stats.missing} fields not present</strong>, 
                and <strong>{letterContent.stats.matches} matching fields</strong> across a total of <strong>{letterContent.stats.total} fields</strong>.
              </p>
            </div>
            
            {/* Documents */}
            <div className="letter-section">
              <h3>Documents Compared</h3>
              <p><strong>Document 1:</strong> {letterContent.doc1Name}</p>
              <p><strong>Document 2:</strong> {letterContent.doc2Name}</p>
            </div>

            {/* Header Differences */}
            {letterContent.headerDiffs.length > 0 && (
              <div className="letter-section">
                <h3>Header Field Differences</h3>
                <ul className="letter-list">
                  {letterContent.headerDiffs.map((diff, index) => (
                    <li key={index} className={diff.type}>
                      <span className="letter-field-name">{diff.field}</span>
                      <div className="letter-field-values">
                        <span>Doc 1: {diff.value1}</span>
                        <span>→</span>
                        <span>Doc 2: {diff.value2}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Signature */}
            <div className="letter-signature">
              <p><strong>Report Generated:</strong> {letterContent.today}</p>
              <p><strong>Total Fields Analyzed:</strong> {letterContent.stats.total}</p>
              <p><strong>Accuracy Rate:</strong> {((letterContent.stats.matches / letterContent.stats.total) * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button onClick={handleDownload} className="action-btn primary">
            <i data-lucide="download"></i>
            <span>Download Letter</span>
          </button>
          <button onClick={onClose} className="action-btn secondary">
            <span>Close</span>
          </button>
        </div>
      </div>
    </div>
  );
}