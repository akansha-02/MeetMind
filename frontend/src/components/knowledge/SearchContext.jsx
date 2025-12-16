import React, { useState } from 'react';
import { knowledgeBaseAPI } from '../../services/api';
import { formatDate } from '../../utils/formatDate';
import toast from 'react-hot-toast';

export const SearchContext = ({ onSelectMeeting }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setLoading(true);
    try {
      const response = await knowledgeBaseAPI.search(query, 10);
      setResults(response.data.results || []);
      
      if (response.data.results.length === 0) {
        toast.info('No results found');
      }
    } catch (error) {
      toast.error('Search failed');
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex space-x-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search past meetings and discussions..."
          className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Search Results</h3>
          <div className="space-y-2">
            {results.map((result, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => onSelectMeeting && onSelectMeeting(result.meetingId)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-900">
                    {result.metadata?.title || 'Meeting'}
                  </h4>
                  {result.metadata?.date && (
                    <span className="text-sm text-gray-500">
                      {formatDate(result.metadata.date)}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm line-clamp-2">
                  {result.content}
                </p>
                {result.metadata?.similarity && (
                  <div className="mt-2 text-xs text-gray-400">
                    Similarity: {(result.metadata.similarity * 100).toFixed(1)}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
