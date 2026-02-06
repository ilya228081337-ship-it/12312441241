import { SearchParams, Document, SearchResult, APIResponse } from '../types';
import { searchOpenAlex } from './api/openAlex';
import { searchArXiv } from './api/arxiv';
import { searchCrossRef } from './api/crossref';
import { searchSemanticScholar } from './api/semanticScholar';
import { searchPubMed } from './api/pubmed';
import { searchCORE } from './api/core';
import { searchDOAJ } from './api/doaj';
import { searchCustomUrls } from './api/urlFetcher';
import { removeDuplicates } from '../utils/textProcessing';
import { StorageService } from './storage';

export class SearchService {
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static async search(params: SearchParams, onProgress?: (message: string) => void): Promise<SearchResult> {
    const allDocuments: Document[] = [];
    const errors: string[] = [];

    const sourceMap: Record<string, () => Promise<APIResponse>> = {
      'OpenAlex': () => searchOpenAlex(params),
      'arXiv': () => searchArXiv(params),
      'CrossRef': () => searchCrossRef(params),
      'SemanticScholar': () => searchSemanticScholar(params),
      'PubMed': () => searchPubMed(params),
      'CORE': () => searchCORE(params),
      'DOAJ': () => searchDOAJ(params)
    };

    const sourcesToSearch = params.sources.length > 0
      ? params.sources
      : Object.keys(sourceMap);

    for (const source of sourcesToSearch) {
      if (!sourceMap[source]) continue;

      try {
        onProgress?.(`Searching ${source}...`);
        const result = await sourceMap[source]();

        if (result.success && result.documents.length > 0) {
          const filtered = this.filterByLanguage(result.documents, params.languages);
          allDocuments.push(...filtered);
          onProgress?.(`Found ${filtered.length} documents from ${source}`);
        } else if (result.error) {
          errors.push(`${source}: ${result.error}`);
        }

        await this.delay(1000);
      } catch (error) {
        console.error(`Error searching ${source}:`, error);
        errors.push(`${source}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (params.customUrls && params.customUrls.length > 0) {
      onProgress?.('Fetching custom URLs...');
      try {
        const result = await searchCustomUrls(params);
        if (result.success && result.documents.length > 0) {
          allDocuments.push(...result.documents);
          onProgress?.(`Found ${result.documents.length} documents from custom URLs`);
        } else if (result.error) {
          errors.push(`Custom URLs: ${result.error}`);
        }
      } catch (error) {
        errors.push(`Custom URLs: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    const uniqueDocuments = removeDuplicates(allDocuments);

    const searchResult: SearchResult = {
      documents: uniqueDocuments,
      total: uniqueDocuments.length,
      query: params,
      timestamp: new Date().toISOString()
    };

    if (uniqueDocuments.length > 0) {
      StorageService.saveDocuments(uniqueDocuments);
      StorageService.saveSearchHistory(searchResult);
    }

    onProgress?.(`Complete! Found ${uniqueDocuments.length} unique documents.`);

    return searchResult;
  }

  private static filterByLanguage(documents: Document[], languages: string[]): Document[] {
    if (!languages || languages.length === 0) return documents;

    return documents.filter(doc =>
      languages.some(lang => doc.language.toLowerCase().startsWith(lang.toLowerCase()))
    );
  }

  static async exportData(format: 'json' | 'csv' | 'ndjson'): Promise<string> {
    switch (format) {
      case 'json':
        return StorageService.exportToJSON();
      case 'csv':
        return StorageService.exportToCSV();
      case 'ndjson':
        return StorageService.exportToNDJSON();
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
