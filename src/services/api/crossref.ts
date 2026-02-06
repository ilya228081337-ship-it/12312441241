import { Document, SearchParams, APIResponse } from '../../types';
import { generateId, cleanText, chunkText, formatDate } from '../../utils/textProcessing';

const BASE_URL = 'https://api.crossref.org/works';

export async function searchCrossRef(params: SearchParams): Promise<APIResponse> {
  try {
    const query = encodeURIComponent(params.keywords);
    const rows = params.maxResults || 20;

    const filters: string[] = [];
    if (params.dateFrom) {
      filters.push(`from-pub-date:${params.dateFrom}`);
    }
    if (params.dateTo) {
      filters.push(`until-pub-date:${params.dateTo}`);
    }

    const filterStr = filters.length > 0 ? `&filter=${filters.join(',')}` : '';
    const url = `${BASE_URL}?query=${query}&rows=${rows}${filterStr}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ResearchCollector/1.0 (mailto:research@example.com)'
      }
    });

    if (!response.ok) {
      throw new Error(`CrossRef API error: ${response.status}`);
    }

    const data = await response.json();
    const documents: Document[] = [];

    if (data.message?.items && Array.isArray(data.message.items)) {
      for (const item of data.message.items) {
        const title = Array.isArray(item.title) ? item.title[0] : item.title || 'Untitled';
        const abstract = item.abstract ? cleanText(item.abstract) : '';
        const fullText = abstract || title;

        const authors = item.author?.map((a: any) =>
          `${a.given || ''} ${a.family || ''}`.trim()
        ).filter(Boolean) || [];

        const pubDate = item.published?.['date-parts']?.[0];
        const dateStr = pubDate
          ? `${pubDate[0]}-${String(pubDate[1] || 1).padStart(2, '0')}-${String(pubDate[2] || 1).padStart(2, '0')}`
          : formatDate(new Date());

        const doc: Document = {
          id: generateId(),
          title: cleanText(title),
          authors,
          date: dateStr,
          doi: item.DOI,
          url: item.URL || `https://doi.org/${item.DOI}`,
          language: item.language || 'en',
          source: 'CrossRef',
          abstract: abstract.substring(0, 500),
          full_text_chunks: chunkText(fullText, 1000, 200),
          created_at: new Date().toISOString()
        };

        documents.push(doc);
      }
    }

    return {
      success: true,
      documents,
      source: 'CrossRef'
    };
  } catch (error) {
    console.error('CrossRef search error:', error);
    return {
      success: false,
      documents: [],
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'CrossRef'
    };
  }
}
