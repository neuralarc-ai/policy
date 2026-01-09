'use client';

import { useDocumentStore } from '@/store/documentStore';

export default function StatsCards() {
  const { comparisonData } = useDocumentStore();

  if (!comparisonData) return null;

  const { matches, diffs, missing, total } = comparisonData.stats;
  const enhancedStats = comparisonData.stats as any;
  const hasEnhancedData = enhancedStats.aiMatches !== undefined;

  return (
    <div className="stats-grid">
      {/* Matches */}
      <div className="stat-card">
        <div className="stat-icon match">
          <i data-lucide="check-circle"></i>
        </div>
        <div className="stat-content">
          <div className="stat-value">{matches}</div>
          <div className="stat-label">
            Matches
            {hasEnhancedData && enhancedStats.aiMatches > 0 && (
              <span className="text-xs text-blue-600 block">
                {enhancedStats.aiMatches} advanced
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Differences */}
      <div className="stat-card">
        <div className="stat-icon diff">
          <i data-lucide="alert-circle"></i>
        </div>
        <div className="stat-content">
          <div className="stat-value">{diffs}</div>
          <div className="stat-label">Differences</div>
        </div>
      </div>

      {/* Not Present */}
      <div className="stat-card">
        <div className="stat-icon missing">
          <i data-lucide="x-circle"></i>
        </div>
        <div className="stat-content">
          <div className="stat-value">{missing}</div>
          <div className="stat-label">Not Present</div>
        </div>
      </div>

      {/* Total */}
      <div className="stat-card">
        <div className="stat-icon total">
          <i data-lucide="file-text"></i>
        </div>
        <div className="stat-content">
          <div className="stat-value">{total}</div>
          <div className="stat-label">
            Total Fields
          </div>
        </div>
      </div>
    </div>
  );
}