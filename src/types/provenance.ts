export type ProvenanceCategory =
  | 'HISTORICAL'
  | 'SYNTHETIC'
  | 'MAP_DATA'
  | 'OPTIONAL_EXTERNAL';

export interface SourceMetadata {
  id: string;
  sourceName: string;
  organization: string;
  sourceURL: string;
  publicationDate?: string;
  datasetVersion?: string;
  retrievalDate?: string;
  purpose: string;
  license: string;
  processingMethod: string;
  usedInScenarios: string[];
  category: ProvenanceCategory;
  note?: string;
}
