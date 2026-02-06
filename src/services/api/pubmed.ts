import { Document, SearchParams, APIResponse } from '../../types';
import { generateId, cleanText, chunkText, formatDate } from '../../utils/textProcessing';

const BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

export async function searchPubMed(params: SearchParams): Promise<APIResponse> {
  try {
    const query = encodeURIComponent(params.keywords);
    const retmax = Math.min(params.maxResults || 20, 100);

    let searchUrl = `${BASE_URL}/esearch.fcgi?db=pubmed&term=${query}&retmax=${retmax}&rettype=json&tool=ResearchCollector&email=research@collector.app`;

    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      throw new Error(`PubMed search error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    const pmids = searchData.esearchresult?.idlist || [];

    if (pmids.length === 0) {
      return {
        success: true,
        documents: [],
        source: 'PubMed'
      };
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    const fetchUrl = `${BASE_URL}/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&rettype=json&tool=ResearchCollector&email=research@collector.app`;

    const fetchResponse = await fetch(fetchUrl);
    if (!fetchResponse.ok) {
      throw new Error(`PubMed fetch error: ${fetchResponse.status}`);
    }

    const fetchData = await fetchResponse.json();
    const documents: Document[] = [];

    const articles = fetchData.result?.uids?.map((uid: string) => fetchData.result[uid]) || [];

    for (const article of articles) {
      const title = article?.title || 'Untitled';
      const abstract = article?.abstract || '';
      const authors = article?.authors?.map((a: any) => a.name).filter(Boolean) || [];

      const dateStr = article?.pubdate
        ? formatDate(article.pubdate)
        : article?.article?.articlepubdate
        ? formatDate(article.article.articlepubdate)
        : formatDate(new Date());

      if (params.dateTo && dateStr > params.dateTo) continue;
      if (params.dateFrom && dateStr < params.dateFrom) continue;

      const fullText = `${title}. ${abstract}`;
      const pmid = article?.uid;

      const doc: Document = {
        id: generateId(),
        title,
        authors,
        date: dateStr,
        doi: article?.uid ? `PMID:${article.uid}` : undefined,
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
        language: 'en',
        source: 'PubMed',
        abstract: cleanText(abstract).substring(0, 500),
        full_text_chunks: chunkText(fullText, 1000, 200),
        files: article?.articleid?.find((id: any) => id.idtype === 'pii')
          ? [{
              type: 'Abstract',
              url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
            }]
          : undefined,
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
