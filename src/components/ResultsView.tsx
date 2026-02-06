import { Document } from '../types';
import { DocumentCard } from './DocumentCard';
import { Download, Trash2, BarChart3 } from 'lucide-react';
import { SearchService } from '../services/searchService';
import { StorageService } from '../services/storage';
import { useState } from 'react';

interface ResultsViewProps {
  documents: Document[];
  onRefresh: () => void;
}

export function ResultsView({ documents, onRefresh }: ResultsViewProps) {
  const [showStats, setShowStats] = useState(false);
  const stats = StorageService.getStatistics();

  const handleExport = async (format: 'json' | 'csv' | 'ndjson') => {
    try {
      const content = await SearchService.exportData(format);
      const mimeTypes = {
        json: 'application/json',
        csv: 'text/csv',
        ndjson: 'application/x-ndjson'
      };
      const extensions = {
        json: 'json',
        csv: 'csv',
        ndjson: 'ndjson'
      };
      const timestamp = new Date().toISOString().split('T')[0];
      SearchService.downloadFile(
        content,
        `research_data_${timestamp}.${extensions[format]}`,
        mimeTypes[format]
      );
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data');
    }
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to delete all saved documents? This cannot be undone.')) {
      StorageService.clearAllDocuments();
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Results ({documents.length} documents)
          </h2>
          <button
            onClick={() => setShowStats(!showStats)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <BarChart3 size={20} />
            {showStats ? 'Hide' : 'Show'} Statistics
          </button>
        </div>

        {showStats && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">By Source</h3>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(stats.bySource).map(([source, count]) => (
                  <div key={source} className="bg-white p-2 rounded text-sm">
                    <div className="font-medium text-gray-900">{source}</div>
                    <div className="text-gray-600">{count} docs</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">By Language</h3>
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(stats.byLanguage).map(([lang, count]) => (
                  <div key={lang} className="bg-white p-2 rounded text-sm">
                    <div className="font-medium text-gray-900">{lang.toUpperCase()}</div>
                    <div className="text-gray-600">{count} docs</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleExport('json')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Download size={20} />
            Export JSON
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Download size={20} />
            Export CSV
          </button>
          <button
            onClick={() => handleExport('ndjson')}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
          >
            <Download size={20} />
            Export NDJSON
          </button>
          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors ml-auto"
          >
            <Trash2 size={20} />
            Clear All
          </button>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">
            No documents yet. Start a search to collect research data.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {documents.map(doc => (
            <DocumentCard key={doc.id} document={doc} />
          ))}
        </div>
      )}
    </div>
  );
}
