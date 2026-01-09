'use client';

import { 
  LayoutDashboard, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  FileText,
  AlertTriangle,
  ShieldAlert
} from 'lucide-react';
import { useDocumentStore } from '@/store/documentStore';
import StatsCards from '@/components/StatsCards';
import ChartsContainer from '@/components/ChartsContainer';
import CriticalMismatches from '@/components/CriticalMismatches';
import CoverageAnalysis from '@/components/CoverageAnalysis';
import ActionButtons from '@/components/ActionButtons';

export default function Dashboard() {
  const { comparisonData } = useDocumentStore();

  if (!comparisonData) return null;

  return (
    <section className="dashboard-section">
      {/* Critical Mismatches - Top Priority */}
      <CriticalMismatches />
      
      {/* Document Names Display */}
      <div className="document-names-section">
        <div className="doc-name-card">
          <div className="doc-label">Document 1</div>
          <div className="doc-name">{comparisonData.doc1.fileName}</div>
        </div>
        <div className="doc-name-card">
          <div className="doc-label">Document 2</div>
          <div className="doc-name">{comparisonData.doc2.fileName}</div>
        </div>
      </div>

      <div className="section-title">
        <i data-lucide="layout-dashboard"></i>
        <h2>Discrepancy Dashboard</h2>
      </div>

      {/* Stats Cards */}
      <StatsCards />

      {/* Charts */}
      <ChartsContainer />

      {/* Coverage Analysis */}
      <CoverageAnalysis />

      {/* Action Buttons */}
      <ActionButtons />
    </section>
  );
}