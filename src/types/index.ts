export interface SearchParams {
  keywords: string;
  dateFrom: string;
  dateTo: string;
  languages: string[];
  sources: string[];
  customUrls?: string[];
  maxResults?: number;
}

export interface DocumentFile {
  type: 'PDF' | 'HTML' | 'TEXT' | 'Abstract' | 'Preprint';
  url: string;
  extracted_text?: string;
}

export interface Document {
  id: string;
  title: string;
  authors: string[];
  date: string;
  doi?: string;
  url: string;
  language: string;
  source: string;
  abstract: string;
  full_text_chunks: string[];
  files?: DocumentFile[];
  snippet?: string;
  relevance_score?: number;
  page_url?: string;
  section_title?: string;
  created_at: string;
}

export interface SearchResult {
  documents: Document[];
  total: number;
  query: SearchParams;
  timestamp: string;
}

export type SourceType =
  | 'OpenAlex'
  | 'arXiv'
  | 'CrossRef'
  | 'PubMed'
  | 'CORE'
  | 'DOAJ'
  | 'SemanticScholar'
  | 'CyberLeninka'
  | 'OATD'
  | 'GoogleScholar'
  | 'CustomURL';

export interface APIResponse {
  success: boolean;
  documents: Document[];
  error?: string;
  source: SourceType;
}
