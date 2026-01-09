'use client';

import { useEffect } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { processDocumentComparisonAsync, initializeEnhancedMatcher } from '@/lib/asyncDocumentParser';

export default function LoadingSection() {
  const { 
    loadingStep, 
    loadingSteps, 
    loadingError,
    package1Data,
    package2Data,
    selectedDoc1,
    selectedDoc2,
    setLoadingStep,
    setCurrentSection,
    setComparisonData,
    setLoadingError
  } = useDocumentStore();

  useEffect(() => {
    // Start processing when LoadingSection mounts
    if (package1Data && package2Data && selectedDoc1 !== null && selectedDoc2 !== null) {
      startProcessing();
    }
  }, []); // Only run once when component mounts

  useEffect(() => {
    // Initialize Lucide icons
    const initIcons = () => {
      if (typeof window !== 'undefined' && (window as any).lucide) {
        (window as any).lucide.createIcons();
      }
    };
    
    const timeoutId = setTimeout(initIcons, 100);
    return () => clearTimeout(timeoutId);
  }, [loadingStep]);

  const startProcessing = async () => {
    if (!package1Data || !package2Data || selectedDoc1 === null || selectedDoc2 === null) {
      return;
    }

    try {
      console.log('🚀 Starting enhanced document comparison...');
      
      // Step 1: Parsing document fields
      setLoadingStep(0);
      await sleep(500);
      
      // Step 2: Initialize the enhanced matcher and run semantic analysis
      setLoadingStep(1);
      initializeEnhancedMatcher();
      await sleep(800);
      
      const doc1 = package1Data.batch[0].fileNameList[selectedDoc1];
      const doc2 = package2Data.batch[0].fileNameList[selectedDoc2];
      
      // Step 3: Matching field values
      setLoadingStep(2);
      await sleep(600);
      
      // Use async enhanced comparison
      const comparisonResult = await processDocumentComparisonAsync(doc1, doc2);
      
      // Final step: Generating results
      setLoadingStep(3);
      await sleep(400);
      
      setComparisonData(comparisonResult);
      setCurrentSection('results');
      
      console.log('✅ Enhanced comparison complete:', {
        totalFields: comparisonResult.stats.total,
        matches: comparisonResult.stats.matches,
      });
      
    } catch (error) {
      console.error('❌ Error during enhanced comparison:', error);
      setLoadingError(error instanceof Error ? error.message : 'Unknown error during comparison');
    }
  };

  // Helper function for realistic delays
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const currentStep = loadingSteps[loadingStep] || 'Processing...';
  const progress = loadingSteps.length > 0 ? ((loadingStep + 1) / loadingSteps.length) * 100 : 0;

  if (loadingError) {
    return (
      <div className="loading-section">
        <div className="loading-content">
          <div className="loading-icon error">
            <i data-lucide="alert-triangle"></i>
          </div>
          <h3 className="loading-title text-red-600">Processing Failed</h3>
          <p className="loading-text text-red-500">{loadingError}</p>
          
          <button 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="loading-section">
      <div className="loading-content">
        <div className="loading-icon">
          <i data-lucide="file-search"></i>
        </div>
        
        <h3 className="loading-title">
          Advanced Document Analysis
        </h3>
        
        <p className="loading-text">
          {currentStep}
        </p>
        
        {/* Enhanced Progress Bar */}
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
            <div className="progress-glow"></div>
          </div>
          
          {/* Step-by-step progress */}
          <div className="progress-steps">
            {loadingSteps.map((step, index) => (
              <div
                key={index}
                className={`step-item ${index <= loadingStep ? 'completed' : ''} ${index === loadingStep ? 'active' : ''}`}
              >
                <div className="step-circle">
                  {index < loadingStep ? (
                    <i data-lucide="check" className="h-3 w-3"></i>
                  ) : index === loadingStep ? (
                    <div className="spinner"></div>
                  ) : (
                    <span className="step-number">{index + 1}</span>
                  )}
                </div>
                <span className="step-label">{step}</span>
              </div>
            ))}
          </div>
          
          {progress > 0 && (
            <div className="progress-text">
              Step {loadingStep + 1} of {loadingSteps.length} ({Math.round(progress)}%)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}