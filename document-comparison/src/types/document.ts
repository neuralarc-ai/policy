// Document types for the insurance comparison tool

export interface FieldData {
  value: string;
  confidence: number;
  flag: string;
}

export interface TableRow {
  rowid: number;
  columns: Record<string, FieldData>;
}

export interface ParsedFields {
  headers: Record<string, FieldData>;
  tables: Record<string, TableRow[]>;
}

export interface DocumentFile {
  fileName: string;
  fieldList: RawField[];
}

export interface PackageBatch {
  packageID: string;
  packageName: string;
  totalFiles: number;
  packageStatus: string;
  fileNameList: DocumentFile[];
}

export interface PackageData {
  batch: PackageBatch[];
}

export interface RawField {
  fieldname: string;
  rowid: string;
  columnname: string;
  extracteddata: string;
  confidencescore: number;
  confidenceflag: string;
}

export interface ComparisonStats {
  matches: number;
  diffs: number;
  missing: number;
  total: number;
}

export interface ComparisonData {
  doc1: DocumentFile;
  doc2: DocumentFile;
  doc1Fields: ParsedFields;
  doc2Fields: ParsedFields;
  stats: ComparisonStats;
}

export interface SemanticMatchResult {
  match: boolean | 'ambiguous';
  confidence: 'exact' | 'synonym' | 'high' | 'ambiguous' | 'different';
  similarity?: number;
}

export interface CriticalMismatch {
  fieldName: string;
  value1: string;
  value2: string;
  type: 'header' | 'table';
  isCritical: boolean;
  isAmbiguous: boolean;
}

export interface PendingVerification {
  fieldName: string;
  value1: string;
  value2: string;
  type: 'header' | 'table';
}

export interface EditHistoryItem {
  timestamp: string;
  field: string;
  document: string;
  oldValue: string;
  newValue: string;
}

export interface CoverageChange {
  fieldName: string;
  value1: string;
  value2: string;
  type: 'increase' | 'restriction';
  impact: string;
}

export interface EndorsementRestriction {
  endorsementName: string;
  formNumber: string;
  restrictionType: string;
  details: string;
  impact: string;
}

export type ComparisonStatus = 'match' | 'diff' | 'missing' | 'ambiguous';

export interface TableRowMatch {
  row1: TableRow | null;
  row2: TableRow | null;
  columnStatus?: Record<string, ComparisonStatus>;
  matchType?: 'content' | 'position' | 'unmatched';
  similarity?: number;
  matchScore?: number;
}
