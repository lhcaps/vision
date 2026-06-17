export type ImportTargetType =
  | 'NEW_CASE'
  | 'EXISTING_CASE'
  | 'RAW_REFERENCE'
  | 'TEMPLATE_SOURCE';

export type ImportCandidateType =
  | 'caseCode'
  | 'documentCode'
  | 'personName'
  | 'offense'
  | 'date'
  | 'agency'
  | 'address';

export type CandidateConfidence = 'cao' | 'vừa' | 'thấp';

export type ImportDetectedCandidate = {
  id: string;
  type: ImportCandidateType;
  label: string;
  value: string;
  confidence: CandidateConfidence;
  source: string;
};

export type ImportDetectedColumn = {
  id: string;
  columnName: string;
  mappedField: string;
  confidence: CandidateConfidence;
};

export type ImportTablePreviewRow = Record<string, string>;

export type ImportTablePreview = {
  sheetName: string;
  headers: string[];
  rows: ImportTablePreviewRow[];
  totalRows: number;
  candidateColumns: ImportDetectedColumn[];
};

export type ImportParsedPayload =
  | {
      kind: 'text';
    }
  | {
      kind: 'json';
      preview: string;
      topLevelKeys: string[];
    }
  | {
      kind: 'table';
      sheetNames: string[];
      tables: ImportTablePreview[];
    }
  | {
      kind: 'image';
    }
  | {
      kind: 'binary';
    };

export type ImportExtractionResult = {
  extractionStatus:
    | 'PARSED'
    | 'PARSED_WITH_WARNINGS'
    | 'STORED_ONLY'
    | 'FAILED'
    | 'REJECTED';
  rawText: string | null;
  parsedJson: ImportParsedPayload | null;
  warnings: string[];
  errorMessage: string | null;
  candidates: ImportDetectedCandidate[];
  previewText: string | null;
  totalRows: number;
};

export type ImportFileMetadata = {
  importFileId: string;
  originalName: string;
  safeName: string | null;
  extension: string | null;
  mimeType: string | null;
  sizeBytes: number;
  checksumSha256: string | null;
  parseStatus: string;
  storagePath: string | null;
  previewText: string | null;
  warnings: string[];
  errorMessage: string | null;
  candidates: ImportDetectedCandidate[];
  parsedJson: ImportParsedPayload | null;
};

export type ImportBatchMetadata = {
  version: 1;
  batchCode: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  warnings: string[];
  target: {
    type: ImportTargetType;
    targetId: string | null;
    summary: string;
    confirmedAt: string;
  } | null;
  files: ImportFileMetadata[];
};
