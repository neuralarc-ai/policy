'use client';

import { useDocumentStore } from '@/store/documentStore';
import Dashboard from '@/components/Dashboard';
import ComparisonResults from '@/components/ComparisonResults';

export default function ResultsSection() {
  const { comparisonData } = useDocumentStore();

  // Show results when ready
  if (!comparisonData) {
    return null;
  }

  return (
    <div>
      <Dashboard />
      <ComparisonResults />
    </div>
  );
}
