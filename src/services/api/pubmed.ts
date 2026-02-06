import { Document, SearchParams, APIResponse } from '../../types';
import { generateId, cleanText, chunkText, formatDate } from '../../utils/textProcessing';

const BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

export async function searchPubMed(params: SearchParams): Promise<APIResponse> {
  try {
    const query = encodeURIComponent(params.keywords);
    const retmax = Math.min(params.maxResults || 20, 100);

    const searchUrl = `${BASE_URL}/esearch.fcgi?db=pubmed&term=${query}&retmax=${retmax}&retmode=json&tool=ResearchCollector&email=research@collector.app`;

    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      throw new Error(`PubMed search error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    console.log('PubMed search response:', searchData);
    const pmids = searchData.esearchresult?.idlist || [];

    if (pmids.length === 0) {
      return {
        success: true,
        documents: [],
        source: 'PubMed'
      };
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    const fetchUrl = `${BASE_URL}/esummary.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=json&tool=ResearchCollector&email=research@collector.app`;

    const fetchResponse = await fetch(fetchUrl);
    if (!fetchResponse.ok) {
      throw new Error(`PubMed fetch error: ${fetchResponse.status}`);
    }

    const fetchData = await fetchResponse.json();
    const documents: Document[] = [];

    if (!fetchData.result) {
      return {
        success: true,
        documents: [],
        source: 'PubMed'
      };
    }

    for (const pmid of pmids) {
      const article = fetchData.result[pmid];
      if (!article || article.error) continue;

      const title = article.title || 'Untitled';
      const authors = article.authors?.map((a: any) => a.name).filter(Boolean) || [];

      const pubDate = article.pubdate || article.epubdate || article.sortpubdate || '';
      const dateStr = pubDate ? formatDate(pubDate) : formatDate(new Date());

      if (params.dateTo && dateStr > params.dateTo) continue;
      if (params.dateFrom && dateStr < params.dateFrom) continue;

      const abstract = article.abstracttext || article.source || article.snippet || '';
      if (!title || !abstract) continue;
      const fullText = `${title}. ${abstract}`;

      const doc: Document = {
        id: generateId(),
        title: cleanText(title),
        authors,
        date: dateStr,
        doi: `PMID:${pmid}`,
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
        language: 'en',
        source: 'PubMed',
        abstract: cleanText(abstract).substring(0, 500),
        full_text_chunks: chunkText(fullText, 1000, 200),
        files: [{
          type: 'Abstract',
          url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
        }],
        created_at: new Date().toISOString()
      };

      documents.push(doc);
    }

    return {
      success: true,
      documents,
      source: 'PubMed'
    };
  } catch (error) {
    console.error('PubMed search error:', error);
    return {
      success: false,
      documents: [],
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'PubMed'
    };
  }
}
