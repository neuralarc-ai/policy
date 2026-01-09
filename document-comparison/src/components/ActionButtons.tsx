'use client';

import { useState } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import LetterModal from '@/components/LetterModal';

export default function ActionButtons() {
  const [showLetterModal, setShowLetterModal] = useState(false);
  const { comparisonData, editHistory } = useDocumentStore();

  const handleGenerateLetter = () => {
    setShowLetterModal(true);
  };

  const handleExportData = () => {
    if (!comparisonData) return;

    const exportData = {
      comparison: comparisonData,
      editHistory: editHistory,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comparison_data_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!comparisonData) return null;

  return (
    <>
      <div className="action-buttons">
        <button
          onClick={handleGenerateLetter}
          className="action-btn primary"
        >
          <i data-lucide="file-text"></i>
          <span>Generate Difference Letter</span>
        </button>
        
        <button
          onClick={handleExportData}
          className="action-btn secondary"
        >
          <i data-lucide="download"></i>
          <span>Export Comparison Data</span>
        </button>
      </div>

      {showLetterModal && (
        <LetterModal 
          onClose={() => setShowLetterModal(false)} 
        />
      )}
    </>
  );
}