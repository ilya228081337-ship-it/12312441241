import { Document, SearchResult } from '../types';

const STORAGE_KEY = 'research_documents';
const SEARCH_HISTORY_KEY = 'search_history';
const MAX_HISTORY = 50;

export class StorageService {
  static saveDocuments(documents: Document[]): void {
    try {
      const existing = this.getAllDocuments();
      const merged = [...existing, ...documents];

      const unique = merged.reduce((acc, doc) => {
        if (!acc.find(d => d.url === doc.url)) {
          acc.push(doc);
        }
        return acc;
      }, [] as Document[]);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
    } catch (error) {
      console.error('Error saving documents:', error);
      throw new Error('Failed to save documents to localStorage');
    }
  }

  static getAllDocuments(): Document[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading documents:', error);
      return [];
    }
  }

  static getDocumentById(id: string): Document | null {
    const documents = this.getAllDocuments();
    return documents.find(doc => doc.id === id) || null;
  }

  static deleteDocument(id: string): void {
    const documents = this.getAllDocuments();
    const filtered = documents.filter(doc => doc.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }

  static clearAllDocuments(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  static searchDocuments(query: string, filters?: {
    source?: string;
    language?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Document[] {
    let documents = this.getAllDocuments();

    if (query) {
      const lowerQuery = query.toLowerCase();
      documents = documents.filter(doc =>
        doc.title.toLowerCase().includes(lowerQuery) ||
        doc.abstract.toLowerCase().includes(lowerQuery) ||
        doc.authors.some(author => author.toLowerCase().includes(lowerQuery))
      );
    }

    if (filters?.source) {
      documents = documents.filter(doc => doc.source === filters.source);
    }

    if (filters?.language) {
      documents = documents.filter(doc => doc.language === filters.language);
    }

    if (filters?.dateFrom) {
      documents = documents.filter(doc => doc.date >= filters.dateFrom!);
    }

    if (filters?.dateTo) {
      documents = documents.filter(doc => doc.date <= filters.dateTo!);
    }

    return documents;
  }

  static saveSearchHistory(searchResult: SearchResult): void {
    try {
      const history = this.getSearchHistory();
      history.unshift(searchResult);

      const trimmed = history.slice(0, MAX_HISTORY);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  }

  static getSearchHistory(): SearchResult[] {
    try {
      const data = localStorage.getItem(SEARCH_HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading search history:', error);
      return [];
    }
  }

  static exportToJSON(): string {
    const documents = this.getAllDocuments();
    return JSON.stringify(documents, null, 2);
  }

  static exportToCSV(): string {
    const documents = this.getAllDocuments();
    if (documents.length === 0) return '';

    const headers = ['ID', 'Title', 'Authors', 'Date', 'DOI', 'URL', 'Language', 'Source', 'Abstract'];
    const rows = documents.map(doc => [
      doc.id,
      doc.title.replace(/"/g, '""'),
      doc.authors.join('; '),
      doc.date,
      doc.doi || '',
      doc.url,
      doc.language,
      doc.source,
      doc.abstract.replace(/"/g, '""')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  static exportToNDJSON(): string {
    const documents = this.getAllDocuments();
    return documents.map(doc => JSON.stringify(doc)).join('\n');
  }

  static getStatistics() {
    const documents = this.getAllDocuments();

    const sourceStats = documents.reduce((acc, doc) => {
      acc[doc.source] = (acc[doc.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const languageStats = documents.reduce((acc, doc) => {
      acc[doc.language] = (acc[doc.language] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const yearStats = documents.reduce((acc, doc) => {
      const year = doc.date.split('-')[0];
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: documents.length,
      bySource: sourceStats,
      byLanguage: languageStats,
      byYear: yearStats
    };
  }
}
