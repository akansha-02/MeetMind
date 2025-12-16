import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchContext } from './SearchContext';

export const KnowledgeBase = () => {
  const navigate = useNavigate();

  const handleSelectMeeting = (meetingId) => {
    if (meetingId) {
      navigate(`/meetings/${meetingId}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Knowledge Base</h1>
        <p className="text-gray-600">
          Search through past meetings and discussions to find relevant context and information.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <SearchContext onSelectMeeting={handleSelectMeeting} />
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">How it works</h3>
        <p className="text-blue-800 text-sm">
          The knowledge base uses semantic search to find relevant content from your past meetings.
          Simply enter a query about what you're looking for, and the system will find related discussions,
          action items, and insights from your meeting history.
        </p>
      </div>
    </div>
  );
};
