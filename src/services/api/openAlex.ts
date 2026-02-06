import { Document, SearchParams, APIResponse } from '../../types';
import { generateId, cleanText, chunkText, formatDate } from '../../utils/textProcessing';

const BASE_URL = 'https://api.openalex.org';

export async function searchOpenAlex(params: SearchParams): Promise<APIResponse> {
  try {
    const query = encodeURIComponent(params.keywords);
    const perPage = Math.min(params.maxResults || 20, 200);

    let url = `${BASE_URL}/works?search=${query}&per-page=${perPage}&sort=publication_date:desc`;

    if (params.dateFrom) {
      url += `&filter=from_publication_date:${params.dateFrom}`;
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ResearchCollector/1.0 (mailto:research@example.com)',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`OpenAlex API error: ${response.status}`);
    }

    const data = await response.json();
    const documents: Document[] = [];

    if (data.results && Array.isArray(data.results)) {
      for (const item of data.results) {
        const abstract = cleanText(item.abstract || item.abstract_inverted_index_string || '');
        const fullText = abstract || item.title || '';

        const doc: Document = {
          id: generateId(),
          title: item.title || 'Untitled',
          authors: item.authorships?.map((a: any) => a.author?.display_name).filter(Boolean) || [],
          date: formatDate(item.publication_date || new Date()),
          doi: item.doi?.replace('https://doi.org/', ''),
          url: item.doi || item.id || '',
          language: detectLanguage(item.title),
          source: 'OpenAlex',
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
      source: 'OpenAlex'
    };
  } catch (error) {
    console.error('OpenAlex search error:', error);
    return {
      success: false,
      documents: [],
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'OpenAlex'
    };
  }
}

function detectLanguage(text: string): string {
  if (!text) return 'en';

  if (/[а-яА-Я]/.test(text)) return 'ru';
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja';
  if (/[\uac00-\ud7af]/.test(text)) return 'ko';
  if (/[\u0590-\u05ff]/.test(text)) return 'he';
  if (/[\u0600-\u06ff]/.test(text)) return 'ar';

  return 'en';
}
