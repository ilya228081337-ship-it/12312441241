import { Document } from '../types';
import { ExternalLink, FileText, Users, Calendar, Globe, Database, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface DocumentCardProps {
  document: Document;
}

export function DocumentCard({ document }: DocumentCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 flex-1">
          {document.title}
        </h3>
        <a
          href={document.url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 text-blue-600 hover:text-blue-800 flex-shrink-0"
        >
          <ExternalLink size={20} />
        </a>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
          <Database size={14} />
          {document.source}
        </span>
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
          <Globe size={14} />
          {document.language.toUpperCase()}
        </span>
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
          <Calendar size={14} />
          {document.date}
        </span>
      </div>

      {document.authors.length > 0 && (
        <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
          <Users size={16} />
          <span>{document.authors.slice(0, 3).join(', ')}
            {document.authors.length > 3 && ` +${document.authors.length - 3} more`}
          </span>
        </div>
      )}

      {document.doi && (
        <div className="mb-3 text-sm text-gray-600">
          <span className="font-medium">DOI:</span> {document.doi}
        </div>
      )}

      <p className="text-gray-700 text-sm mb-4 line-clamp-3">
        {document.abstract || 'No abstract available'}
      </p>

      {document.files && document.files.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {document.files.map((file, idx) => (
            <a
              key={idx}
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-md text-xs font-medium hover:bg-red-200"
            >
              <FileText size={14} />
              {file.type}
            </a>
          ))}
        </div>
      )}

      {document.full_text_chunks.length > 0 && (
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {expanded ? 'Hide' : 'Show'} Text Chunks ({document.full_text_chunks.length})
          </button>
          {expanded && (
            <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
              {document.full_text_chunks.map((chunk, idx) => (
                <div key={idx} className="bg-gray-50 p-3 rounded text-xs text-gray-700">
                  <div className="font-medium text-gray-900 mb-1">Chunk {idx + 1}</div>
                  <div className="line-clamp-3">{chunk}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
