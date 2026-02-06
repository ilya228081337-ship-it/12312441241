import { Document, SearchParams, APIResponse } from '../../types';
import { generateId, cleanText, chunkText, formatDate } from '../../utils/textProcessing';

const BASE_URL = 'https://doaj.org/api/v3/search/articles';

export async function searchDOAJ(params: SearchParams): Promise<APIResponse> {
  try {
    const query = params.keywords;
    const pageSize = Math.min(params.maxResults || 20, 100);

    const url = `${BASE_URL}/${query}?pageSize=${pageSize}&sort=created_date:desc`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`DOAJ API error: ${response.status}`);
    }

    const data = await response.json();
    const documents: Document[] = [];

    if (data.results && Array.isArray(data.results)) {
      for (const item of data.results) {
        const bibjson = item.bibjson || {};
        const title = bibjson.title || 'Untitled';
        const abstract = bibjson.abstract || '';
        const authors = bibjson.author?.map((a: any) => a.name).filter(Boolean) || [];

        const dateStr = bibjson.published_date
          ? formatDate(bibjson.published_date)
          : formatDate(new Date());

        if (params.dateTo && dateStr > params.dateTo) continue;
        if (params.dateFrom && dateStr < params.dateFrom) continue;

        const fullText = `${title}. ${abstract}`;

        const doc: Document = {
          id: generateId(),
          title,
          authors,
          date: dateStr,
          doi: bibjson.identifier?.find((id: any) => id.type === 'doi')?.id,
          url: bibjson.link?.find((link: any) => link.type === 'fulltext')?.url || item.admin?.url || `https://doaj.org/article/${item.id}`,
          language: bibjson.language?.[0]?.toLowerCase() || 'en',
          source: 'DOAJ',
          abstract: cleanText(abstract).substring(0, 500),
          full_text_chunks: chunkText(fullText, 1000, 200),
          files: bibjson.link?.filter((link: any) => link.type === 'fulltext').map((link: any) => ({
            type: 'PDF',
            url: link.url
          })),
          created_at: new Date().toISOString()
        };

        documents.push(doc);
      }
    }

    return {
      success: true,
      documents,
      source: 'DOAJ'
    };
  } catch (error) {
    console.error('DOAJ search error:', error);
    return {
      success: false,
      documents: [],
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'DOAJ'
    };
  }
}
