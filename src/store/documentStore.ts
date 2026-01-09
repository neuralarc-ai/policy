import { create } from 'zustand';
import { 
  PackageData, 
  ComparisonData, 
  EditHistoryItem, 
  PendingVerification 
} from '@/types/document';

export interface DocumentStore {
  // Package data
  package1Data: PackageData | null;
  package2Data: PackageData | null;
  
  // Selected documents
  selectedDoc1: number | null;
  selectedDoc2: number | null;
  
  // Comparison data
  comparisonData: ComparisonData | null;
  
  // UI state
  currentSection: 'upload' | 'selection' | 'loading' | 'results';
  isLoading: boolean;
  
  // Edit tracking
  editHistory: EditHistoryItem[];
  pendingVerifications: PendingVerification[];
  
  // Actions
  setPackageData: (packageNum: 1 | 2, data: PackageData) => void;
  setSelectedDocument: (docNum: 1 | 2, index: number | null) => void;
  setComparisonData: (data: ComparisonData) => void;
  setCurrentSection: (section: 'upload' | 'selection' | 'loading' | 'results') => void;
  setLoading: (loading: boolean) => void;
  addEditHistory: (item: EditHistoryItem) => void;
  setPendingVerifications: (verifications: PendingVerification[]) => void;
  reset: () => void;
}

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  // Initial state
  package1Data: null,
  package2Data: null,
  selectedDoc1: null,
  selectedDoc2: null,
  comparisonData: null,
  currentSection: 'upload',
  isLoading: false,
  editHistory: [],
  pendingVerifications: [],

  // Actions
  setPackageData: (packageNum, data) => {
    if (packageNum === 1) {
      set({ package1Data: data });
    } else {
      set({ package2Data: data });
    }
    
    // Auto-advance to selection if both packages loaded
    const state = get();
    if (state.package1Data && state.package2Data) {
      set({ currentSection: 'selection' });
    }
  },

  setSelectedDocument: (docNum, index) => {
    if (docNum === 1) {
      set({ selectedDoc1: index });
    } else {
      set({ selectedDoc2: index });
    }
  },

  setComparisonData: (data) => {
    set({ comparisonData: data });
  },

  setCurrentSection: (section) => {
    set({ currentSection: section });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  addEditHistory: (item) => {
    set((state) => ({
      editHistory: [...state.editHistory, item]
    }));
  },

  setPendingVerifications: (verifications) => {
    set({ pendingVerifications: verifications });
  },

  reset: () => {
    set({
      package1Data: null,
      package2Data: null,
      selectedDoc1: null,
      selectedDoc2: null,
      comparisonData: null,
      currentSection: 'upload',
      isLoading: false,
      editHistory: [],
      pendingVerifications: []
    });
  }
}));
