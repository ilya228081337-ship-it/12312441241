import { Document, SearchParams, APIResponse } from '../../types';
import { generateId, cleanText, chunkText, formatDate } from '../../utils/textProcessing';

const BASE_URL = 'https://export.arxiv.org/api/query';

export async function searchArXiv(params: SearchParams): Promise<APIResponse> {
  try {
    const query = encodeURIComponent(params.keywords);
    const maxResults = Math.min(params.maxResults || 20, 100);

    const url = `${BASE_URL}?search_query=all:${query}&start=0&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ResearchCollector/1.0 (mailto:research@example.com)'
      }
    });

    if (!response.ok) {
      throw new Error(`arXiv API error: ${response.status}`);
    }

    const xmlText = await response.text();
    console.log('arXiv raw response length:', xmlText.length);
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
      throw new Error('XML parsing error from arXiv');
    }

    const entries = xmlDoc.getElementsByTagName('entry');
    console.log('arXiv entries found:', entries.length);
    const documents: Document[] = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      let title = entry.getElementsByTagName('title')[0]?.textContent || '';
      title = title.replace(/\n\s+/g, ' ').trim();

      const summary = entry.getElementsByTagName('summary')[0]?.textContent || '';
      const published = entry.getElementsByTagName('published')[0]?.textContent || '';
      let id = entry.getElementsByTagName('id')[0]?.textContent || '';
      id = id.trim();

      const authors: string[] = [];
      const authorElements = entry.getElementsByTagName('author');
      for (let j = 0; j < authorElements.length; j++) {
        const name = authorElements[j].getElementsByTagName('name')[0]?.textContent;
        if (name) authors.push(name.trim());
      }

      if (!title || !id) continue;

      const cleanedSummary = cleanText(summary);
      const fullText = `${title}\n\n${cleanedSummary}`;

      if (params.dateFrom && params.dateTo) {
        const pubDate = formatDate(published);
        if (pubDate < params.dateFrom || pubDate > params.dateTo) {
          continue;
        }
      }

      const doc: Document = {
        id: generateId(),
        title: cleanText(title),
        authors,
        date: formatDate(published),
        url: id,
        language: 'en',
        source: 'arXiv',
        abstract: cleanedSummary.substring(0, 500),
        full_text_chunks: chunkText(fullText, 1000, 200),
        files: [{
          type: 'PDF',
          url: id.replace('/abs/', '/pdf/') + '.pdf'
        }],
        created_at: new Date().toISOString()
      };

      documents.push(doc);
    }

    return {
      success: true,
      documents,
      source: 'arXiv'
    };
  } catch (error) {
    console.error('arXiv search error:', error);
    return {
      success: false,
      documents: [],
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'arXiv'
    };
  }
}
