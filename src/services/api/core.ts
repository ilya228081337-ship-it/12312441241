import { Document, SearchParams, APIResponse } from '../../types';
import { generateId, cleanText, chunkText, formatDate } from '../../utils/textProcessing';

const BASE_URL = 'https://api.core.ac.uk/v3/search/works';

export async function searchCORE(params: SearchParams): Promise<APIResponse> {
  try {
    const query = encodeURIComponent(params.keywords);
    const limit = Math.min(params.maxResults || 20, 100);

    const url = `${BASE_URL}?q=${query}&limit=${limit}`;
    console.log('CORE search URL:', url);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn(`CORE API status: ${response.status}`);
      if (response.status === 401 || response.status === 403 || response.status === 429) {
        return {
          success: true,
          documents: [],
          source: 'CORE'
        };
      }
      throw new Error(`CORE API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('CORE response:', data);
    const documents: Document[] = [];

    if (data.results && Array.isArray(data.results)) {
      for (const item of data.results) {
        const title = item.title || 'Untitled';
        const abstract = item.abstract || '';
        const authors = item.authors?.map((a: any) => typeof a === 'string' ? a : a.name).filter(Boolean) || [];

        const dateStr = item.datePublished
          ? formatDate(item.datePublished)
          : formatDate(new Date());

        if (params.dateTo && dateStr > params.dateTo) continue;
        if (params.dateFrom && dateStr < params.dateFrom) continue;

        const fullText = `${title}. ${abstract}`;

        const doc: Document = {
          id: generateId(),
          title,
          authors,
          date: dateStr,
          doi: item.doi,
          url: item.sourceUrl || item.repositoryUrl || `https://core.ac.uk/works/${item.id}`,
          language: 'en',
          source: 'CORE',
          abstract: cleanText(abstract).substring(0, 500),
          full_text_chunks: chunkText(fullText, 1000, 200),
          files: item.downloadUrl
            ? [{
                type: 'PDF',
                url: item.downloadUrl
              }]
            : undefined,
          created_at: new Date().toISOString()
        };

        documents.push(doc);
      }
    }

    return {
      success: true,
      documents,
      source: 'CORE'
    };
  } catch (error) {
    console.error('CORE search error:', error);
    return {
      success: false,
      documents: [],
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'CORE'
    };
  }
}
