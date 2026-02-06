import { useState, useEffect } from 'react';
import { SearchForm } from './components/SearchForm';
import { ResultsView } from './components/ResultsView';
import { SearchParams, Document } from './types';
import { SearchService } from './services/searchService';
import { StorageService } from './services/storage';
import { BookOpen, Loader2 } from 'lucide-react';

function App() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'search' | 'results'>('search');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = () => {
    const savedDocs = StorageService.getAllDocuments();
    setDocuments(savedDocs);
  };

  const handleSearch = async (params: SearchParams) => {
    setIsSearching(true);
    setProgress('Initializing search...');
    setActiveTab('results');

    try {
      await SearchService.search(params, (message) => {
        setProgress(message);
      });

      loadDocuments();
    } catch (error) {
      console.error('Search error:', error);
      setProgress('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
      setTimeout(() => setProgress(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen size={40} className="text-blue-600" />
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                Research Information Collector
              </h1>
              <p className="text-gray-600 mt-1">
                Automated collection system for academic and scientific data
              </p>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setActiveTab('search')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'search'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Search
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'results'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Results ({documents.length})
            </button>
          </div>
        </header>

        {isSearching && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
            <Loader2 className="animate-spin text-blue-600" size={24} />
            <span className="text-blue-900 font-medium">{progress}</span>
          </div>
        )}

        {activeTab === 'search' && (
          <div className="max-w-3xl mx-auto">
            <SearchForm onSearch={handleSearch} isSearching={isSearching} />

            <div className="mt-8 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Features</h2>
              <ul className="space-y-2 text-gray-700">
                <li>✓ Search across 7 academic databases (OpenAlex, arXiv, CrossRef, Semantic Scholar, PubMed, CORE, DOAJ)</li>
                <li>✓ Multi-language support (English, Russian, Chinese, Japanese, Arabic, Hebrew, and more)</li>
                <li>✓ Structured data output with metadata and text chunks</li>
                <li>✓ Export to JSON, CSV, or NDJSON formats</li>
                <li>✓ Local storage - all data saved in your browser</li>
                <li>✓ Text chunking for RAG pipelines (500-2000 tokens per chunk)</li>
                <li>✓ Custom URL parsing with content extraction</li>
                <li>✓ Ethical scraping with delays between requests</li>
              </ul>
            </div>

            <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">Note</h3>
              <p className="text-yellow-800 text-sm">
                This system uses public APIs and open-access databases. Some features like PDF text extraction
                and custom URL scraping may be limited due to CORS restrictions in browser environments.
                For production use, consider implementing a server-side proxy.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <ResultsView documents={documents} onRefresh={loadDocuments} />
        )}
      </div>

      <footer className="mt-16 pb-8 text-center text-gray-600 text-sm">
        <p>Research Information Collector v1.0 - For educational and research purposes only</p>
        <p className="mt-1">Always respect website Terms of Service and robots.txt</p>
      </footer>
    </div>
  );
}

export default App;
