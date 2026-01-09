'use client';

import { useEffect } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import UploadSection from '@/components/UploadSection';
import SelectionSection from '@/components/SelectionSection';
import LoadingSection from '@/components/LoadingSection';
import ResultsSection from '@/components/ResultsSection';

export default function HomePage() {
  const { currentSection, loadingSteps } = useDocumentStore();

  // Simple, non-conflicting icon initialization
  useEffect(() => {
    const initIcons = () => {
      try {
        if (typeof window !== 'undefined' && (window as any).lucide) {
          (window as any).lucide.createIcons();
        }
      } catch (error) {
        // Silently handle any icon initialization errors
        console.debug('Icon initialization skipped:', error);
      }
    };

    const timeoutId = setTimeout(initIcons, 50);
    return () => clearTimeout(timeoutId);
  }, [currentSection]);

  return (
    <div className="app-container">
      <Header />
      
      <main className="app-main">
        <UploadSection />
        
        {currentSection === 'selection' && <SelectionSection />}
        {currentSection === 'loading' && <LoadingSection />}
        {currentSection === 'results' && <ResultsSection />}
      </main>
      
      <Footer />
    </div>
  );
}