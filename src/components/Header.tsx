'use client';

import { useEffect } from 'react';

export default function Header() {
  useEffect(() => {
    // Initialize Lucide icons for this component only
    if (typeof window !== 'undefined' && (window as any).lucide) {
      (window as any).lucide.createIcons();
    }
  }, []);

  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="brand">
          <i data-lucide="file-diff" className="brand-icon"></i>
          <h1 className="brand-title">Document Comparison</h1>
        </div>
        <p className="brand-subtitle">Insurance Policy Document Analysis & Reporting Tool</p>
      </div>
    </header>
  );
}