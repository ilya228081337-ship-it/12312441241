import { Document, SearchParams, APIResponse } from '../../types';
import { generateId, cleanText, chunkText, formatDate } from '../../utils/textProcessing';

const BASE_URL = 'https://api.semanticscholar.org/graph/v1/paper/search';

export async function searchSemanticScholar(params: SearchParams): Promise<APIResponse> {
  try {
    const query = encodeURIComponent(params.keywords);
    const limit = Math.min(params.maxResults || 20, 100);

    let url = `${BASE_URL}?query=${query}&limit=${limit}&fields=paperId,title,abstract,authors,year,publicationDate,url,openAccessPdf`;

    if (params.dateFrom) {
      const year = parseInt(params.dateFrom.split('-')[0]);
      const currentYear = new Date().getFullYear();
      url += `&year=${year}-${currentYear}`;
    }

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Semantic Scholar API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('SemanticScholar response:', data);
    const documents: Document[] = [];

    const items = data.data || [];
    if (!Array.isArray(items) || items.length === 0) {
      return {
        success: true,
        documents: [],
        source: 'SemanticScholar'
      };
    }

    for (const item of items) {
        const abstract = cleanText(item.abstract || '');
        const fullText = abstract || item.title || '';

        const authors = item.authors?.map((a: any) => a.name).filter(Boolean) || [];

        const dateStr = item.publicationDate
          ? formatDate(item.publicationDate)
          : item.year
          ? `${item.year}-01-01`
          : formatDate(new Date());

        if (params.dateTo) {
          if (dateStr > params.dateTo) continue;
        }

        const doc: Document = {
          id: generateId(),
          title: item.title || 'Untitled',
          authors,
          date: dateStr,
          url: item.url || `https://www.semanticscholar.org/paper/${item.paperId}`,
          language: 'en',
          source: 'SemanticScholar',
          abstract: abstract.substring(0, 500),
          full_text_chunks: chunkText(fullText, 1000, 200),
          files: item.openAccessPdf ? [{
            type: 'PDF',
            url: item.openAccessPdf.url
          }] : undefined,
          created_at: new Date().toISOString()
        };

        documents.push(doc);
    }

    return {
      success: true,
      documents,
      source: 'SemanticScholar'
    };
  } catch (error) {
    console.error('Semantic Scholar search error:', error);
    return {
      success: false,
      documents: [],
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'SemanticScholar'
    };
  }
}
