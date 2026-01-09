'use client';

import { useEffect } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import HeaderComparison from '@/components/HeaderComparison';
import TableComparisons from '@/components/TableComparisons';

export default function ComparisonResults() {
  const { comparisonData } = useDocumentStore();

  useEffect(() => {
    // Re-initialize Lucide icons
    if (typeof window !== 'undefined' && (window as any).lucide) {
      (window as any).lucide.createIcons();
    }
  }, []);

  if (!comparisonData) return null;

  return (
    <section className="comparison-section">
      {/* Results Header */}
      <div className="results-header">
        <div className="results-title">
          <i data-lucide="check-circle-2"></i>
          <h2>Detailed Comparison</h2>
        </div>
        <div className="results-legend">
          <div className="legend-item">
            <span className="legend-dot match"></span>
            <span>Match</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot diff"></span>
            <span>Different</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot missing"></span>
            <span>Missing</span>
          </div>
        </div>
      </div>

      {/* Header Fields Comparison */}
      <HeaderComparison />

      {/* Table Comparisons */}
      <TableComparisons />
    </section>
  );
}