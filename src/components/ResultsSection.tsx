'use client';

import { useEffect } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { parseFields, calculateStats } from '@/lib/documentParser';
import { ComparisonData } from '@/types/document';
import { config } from '@/lib/config';
import Dashboard from '@/components/Dashboard';
import ComparisonResults from '@/components/ComparisonResults';

export default function ResultsSection() {
  const { 
    package1Data, 
    package2Data, 
    selectedDoc1, 
    selectedDoc2, 
    comparisonData, 
    setComparisonData 
  } = useDocumentStore();

  useEffect(() => {
    // Process the comparison data when component mounts - NO LOADING STATE HERE
    if (package1Data && package2Data && selectedDoc1 !== null && selectedDoc2 !== null) {
      try {
        const doc1 = package1Data.batch[0].fileNameList[selectedDoc1];
        const doc2 = package2Data.batch[0].fileNameList[selectedDoc2];
        
        console.log('📊 Starting document comparison');
        
        const doc1Fields = parseFields(doc1.fieldList);
        const doc2Fields = parseFields(doc2.fieldList);
        const stats = calculateStats(doc1Fields, doc2Fields);
        
        const data: ComparisonData = {
          doc1,
          doc2,
          doc1Fields,
          doc2Fields,
          stats
        };
        
        setComparisonData(data);
        console.log('✅ Comparison processing complete');
        
      } catch (error) {
        console.error('❌ Error during comparison processing:', error);
      }
    }
  }, [package1Data, package2Data, selectedDoc1, selectedDoc2, setComparisonData]);

  // NO LOADING STATE - Just render results directly
  if (!comparisonData) {
    return null; // Let the main LoadingSection handle the loading display
  }

  return (
    <div>
      <Dashboard />
      <ComparisonResults />
    </div>
  );
}
