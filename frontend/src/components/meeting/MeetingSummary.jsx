import React, { useState } from 'react';
import { formatDate } from '../../utils/formatDate';
import toast from 'react-hot-toast';
import { meetingsAPI } from '../../services/api';
// import { MermaidDiagram } from '../summarize/MermaidDiagram';

export const MeetingSummary = ({ meeting, onSummaryUpdate }) => {
  const [generating, setGenerating] = useState(false);

  const handleGenerateSummary = async () => {
    if (!meeting?.transcript) {
      toast.error('No transcript available');
      return;
    }

    setGenerating(true);
    try {
      const { data } = await meetingsAPI.generateSummary(meeting._id, {
        transcript: meeting.transcript,
        language: meeting.language || 'en'
      });
      
      toast.success(`Summary generated${data?.provider ? ` using ${data.provider}` : ''}`);
      
      if (onSummaryUpdate) {
        onSummaryUpdate(data.summary);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to generate summary');
      console.error('Summary generation error:', error);
    } finally {
      setGenerating(false);
    }
  };

  if (!meeting) return null;

  return (
    <div className="space-y-6">
      {/* Meeting Details */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">{meeting.title || 'Untitled Meeting'}</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Status:</span>
            <span className={`ml-2 px-2 py-1 rounded ${
              meeting.status === 'completed' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {meeting.status}
            </span>
          </div>
          {meeting.startTime && (
            <div>
              <span className="text-gray-500">Start Time:</span>
              <span className="ml-2 text-gray-900">{formatDate(meeting.startTime)}</span>
            </div>
          )}
          {meeting.endTime && (
            <div>
              <span className="text-gray-500">End Time:</span>
              <span className="ml-2 text-gray-900">{formatDate(meeting.endTime)}</span>
            </div>
          )}
          {meeting.language && (
            <div>
              <span className="text-gray-500">Language:</span>
              <span className="ml-2 text-gray-900 uppercase">{meeting.language}</span>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      {meeting.summary && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Summary</h3>
            <button
              onClick={handleGenerateSummary}
              disabled={generating}
              className="text-sm px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {generating ? 'Regenerating...' : 'Regenerate'}
            </button>
          </div>
          <p className="text-gray-700 whitespace-pre-wrap">{meeting.summary}</p>
        </div>
      )}

      {/* Generate Summary if missing */}
      {!meeting.summary && meeting.transcript && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">No Summary Yet</h3>
          <p className="text-blue-800 mb-4">Generate an AI summary of this meeting transcript.</p>
          <button
            onClick={handleGenerateSummary}
            disabled={generating}
            className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {generating ? 'Generating Summary...' : 'Generate Summary'}
          </button>
        </div>
      )}

      {/* Meeting Minutes */}
      {meeting.minutes && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Meeting Minutes</h3>
          <div className="text-gray-700 whitespace-pre-wrap">{meeting.minutes}</div>
        </div>
      )}

      {/* Transcript */}
      {meeting.transcript && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Full Transcript</h3>
          <div className="text-gray-700 whitespace-pre-wrap max-h-96 overflow-y-auto">
            {meeting.transcript}
          </div>
        </div>
      )}
    </div>
  );
};

