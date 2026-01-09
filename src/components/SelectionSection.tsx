'use client';

import { useDocumentStore } from '@/store/documentStore';
import { config } from '@/lib/config';

export default function SelectionSection() {
  const { 
    package1Data, 
    package2Data, 
    selectedDoc1, 
    selectedDoc2, 
    setSelectedDocument,
    setCurrentSection,
    setLoadingStep,
    resetComparison
  } = useDocumentStore();

  const handleDoc1Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedDocument(1, value ? parseInt(value) : null);
  };

  const handleDoc2Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedDocument(2, value ? parseInt(value) : null);
  };

  const handleCompare = () => {
    // Reset any previous comparison data
    resetComparison();
    
    // Define processing steps for document comparison
    const steps = [
      'Parsing document fields',
      'Running semantic analysis', 
      'Matching field values',
      'Generating comparison results'
    ];
    
    // Initialize loading with steps
    setLoadingStep(0, steps);
    setCurrentSection('loading');
  };

  const canCompare = selectedDoc1 !== null && selectedDoc2 !== null;

  if (!package1Data || !package2Data) return null;

  return (
    <section className="selection-section">
      <div className="section-title">
        <i data-lucide="file-search"></i>
        <h2>Select Documents to Compare</h2>
      </div>
      
      <div className="selection-container">
        <div className="select-group">
          <label className="select-label">
            <span className="select-label-text">Document from Package 1</span>
            <select 
              value={selectedDoc1 ?? ''}
              onChange={handleDoc1Change}
              className="select-input"
            >
              <option value="">-- Select Document --</option>
              {package1Data.batch[0].fileNameList.map((file, index) => (
                <option key={index} value={index}>
                  {file.fileName}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="select-divider">
          <i data-lucide="arrow-right"></i>
        </div>

        <div className="select-group">
          <label className="select-label">
            <span className="select-label-text">Document from Package 2</span>
            <select 
              value={selectedDoc2 ?? ''}
              onChange={handleDoc2Change}
              className="select-input"
            >
              <option value="">-- Select Document --</option>
              {package2Data.batch[0].fileNameList.map((file, index) => (
                <option key={index} value={index}>
                  {file.fileName}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <button
        onClick={handleCompare}
        disabled={!canCompare}
        className="compare-button"
      >
        <i data-lucide="git-compare"></i>
        <span>Compare Documents</span>
      </button>
    </section>
  );
}