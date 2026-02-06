import { Document, SearchParams, APIResponse } from '../../types';
import { generateId, cleanText, chunkText, formatDate } from '../../utils/textProcessing';

async function fetchUrlContent(url: string): Promise<{ text: string; title: string } | null> {
  try {
    const corsProxies = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      `https://corsproxy.io/?${encodeURIComponent(url)}`
    ];

    for (const proxyUrl of corsProxies) {
      try {
        const response = await fetch(proxyUrl, {
          headers: {
            'User-Agent': 'Research-Information-Collector/1.0'
          }
        });

        if (response.ok) {
          const html = await response.text();

          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          const title = titleMatch ? titleMatch[1].trim() : new URL(url).hostname;

          const textContent = extractTextFromHtml(html);

          return {
            text: textContent,
            title
          };
        }
      } catch (error) {
        continue;
      }
    }

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Research-Information-Collector/1.0'
        }
      });

      if (response.ok) {
        const html = await response.text();

        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : new URL(url).hostname;

        const textContent = extractTextFromHtml(html);

        return {
          text: textContent,
          title
        };
      }
    } catch (error) {
      console.error('Direct fetch failed:', error);
    }

    return null;
  } catch (error) {
    console.error('Error fetching URL:', error);
    return null;
  }
}

function extractTextFromHtml(html: string): string {
  let text = html;

  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
  text = text.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
  text = text.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');

  text = text.replace(/<[^>]+>/g, ' ');

  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&[a-z]+;/gi, ' ');

  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

export async function searchCustomUrls(params: SearchParams): Promise<APIResponse> {
  const documents: Document[] = [];
  const urls = params.customUrls || [];

  if (urls.length === 0) {
    return {
      success: true,
      documents: [],
      source: 'CustomURL'
    };
  }

  for (const url of urls) {
    if (!url.trim()) continue;

    try {
      let urlToFetch = url.trim();
      if (!urlToFetch.startsWith('http://') && !urlToFetch.startsWith('https://')) {
        urlToFetch = `https://${urlToFetch}`;
      }

      const content = await fetchUrlContent(urlToFetch);

      if (content && content.text.length > 50) {
        const abstract = content.text.substring(0, 500);
        const fullText = content.text;

        const keywords = params.keywords.toLowerCase().split(/\s+/);
        const textLower = fullText.toLowerCase();
        const relevantMatches = keywords.filter(kw => textLower.includes(kw)).length;

        if (relevantMatches === 0) {
          continue;
        }

        const doc: Document = {
          id: generateId(),
          title: content.title,
          authors: [],
          date: formatDate(new Date()),
          url: urlToFetch,
          language: 'unknown',
          source: 'CustomURL',
          abstract: cleanText(abstract),
          full_text_chunks: chunkText(cleanText(fullText), 1000, 200),
          page_url: urlToFetch,
          created_at: new Date().toISOString()
        };

        documents.push(doc);
      } else if (!content) {
        console.warn(`Could not fetch content from ${urlToFetch}`);

        const doc: Document = {
          id: generateId(),
          title: `Content from ${new URL(urlToFetch).hostname}`,
          authors: [],
          date: formatDate(new Date()),
          url: urlToFetch,
          language: 'unknown',
          source: 'CustomURL',
          abstract: `Unable to fetch content due to CORS restrictions or page structure. Please access directly: ${urlToFetch}`,
          full_text_chunks: [],
          page_url: urlToFetch,
          created_at: new Date().toISOString()
        };

        documents.push(doc);
      }

      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (error) {
      console.error(`Error processing URL ${url}:`, error);
    }
  }

  return {
    success: true,
    documents,
    source: 'CustomURL'
  };
}
