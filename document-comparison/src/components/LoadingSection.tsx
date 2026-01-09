'use client';

import { useEffect, useState } from 'react';

export default function LoadingSection() {
  const [currentStage, setCurrentStage] = useState(0);
  const stages = ['Parsing', 'Comparing', 'Analyzing', 'Complete'];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStage(prev => {
        if (prev < stages.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [stages.length]);

  return (
    <div className="loading-section">
      <div className="loading-content">
        <div className="loading-icon">
          <i data-lucide="file-search"></i>
        </div>
        <h3 className="loading-title">Analyzing Documents</h3>
        <p className="loading-text">Comparing fields and detecting differences...</p>
        
        {/* Gradient Progress Bar */}
        <div className="progress-container">
          <div className="progress-bar">
            <div className="progress-fill"></div>
            <div className="progress-glow"></div>
          </div>
          <div className="progress-stages">
            {stages.map((stage, index) => (
              <span
                key={stage}
                className={`stage ${index <= currentStage ? 'active' : ''}`}
              >
                {stage}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}