import { useState } from 'react';
import { SearchParams } from '../types';
import { Search } from 'lucide-react';

interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
  isSearching: boolean;
}

export function SearchForm({ onSearch, isSearching }: SearchFormProps) {
  const [keywords, setKeywords] = useState('');
  const [dateFrom, setDateFrom] = useState('2024-01-01');
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['en', 'ru']);
  const [selectedSources, setSelectedSources] = useState<string[]>(['OpenAlex', 'arXiv', 'CrossRef', 'SemanticScholar', 'PubMed']);
  const [customUrls, setCustomUrls] = useState('');
  const [maxResults, setMaxResults] = useState(20);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'ru', name: 'Русский' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'es', name: 'Español' },
    { code: 'zh', name: '中文' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'ar', name: 'العربية' },
    { code: 'he', name: 'עברית' }
  ];

  const sources = ['OpenAlex', 'arXiv', 'CrossRef', 'SemanticScholar', 'PubMed', 'CORE', 'DOAJ'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!keywords.trim()) {
      alert('Please enter keywords');
      return;
    }

    const params: SearchParams = {
      keywords: keywords.trim(),
      dateFrom,
      dateTo,
      languages: selectedLanguages,
      sources: selectedSources,
      customUrls: customUrls.split('\n').map(url => url.trim()).filter(Boolean),
      maxResults
    };

    onSearch(params);
  };

  const toggleLanguage = (code: string) => {
    setSelectedLanguages(prev =>
      prev.includes(code) ? prev.filter(l => l !== code) : [...prev, code]
    );
  };

  const toggleSource = (source: string) => {
    setSelectedSources(prev =>
      prev.includes(source) ? prev.filter(s => s !== source) : [...prev, source]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Keywords
        </label>
        <input
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="e.g., геополитика Украина, climate change"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isSearching}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date From
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSearching}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date To
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSearching}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Languages
        </label>
        <div className="grid grid-cols-5 gap-2">
          {languages.map(lang => (
            <button
              key={lang.code}
              type="button"
              onClick={() => toggleLanguage(lang.code)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedLanguages.includes(lang.code)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={isSearching}
            >
              {lang.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sources
        </label>
        <div className="grid grid-cols-3 gap-2">
          {sources.map(source => (
            <button
              key={source}
              type="button"
              onClick={() => toggleSource(source)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedSources.includes(source)
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={isSearching}
            >
              {source}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Max Results per Source
        </label>
        <input
          type="number"
          value={maxResults}
          onChange={(e) => setMaxResults(parseInt(e.target.value))}
          min="5"
          max="100"
          step="5"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isSearching}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Custom URLs (optional, one per line)
        </label>
        <textarea
          value={customUrls}
          onChange={(e) => setCustomUrls(e.target.value)}
          placeholder="https://example.com/article1&#10;https://example.com/article2"
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isSearching}
        />
      </div>

      <button
        type="submit"
        disabled={isSearching}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Search size={20} />
        {isSearching ? 'Searching...' : 'Start Search'}
      </button>
    </form>
  );
}
