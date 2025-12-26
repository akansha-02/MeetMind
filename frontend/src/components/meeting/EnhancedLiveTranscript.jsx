import React from 'react';

export const EnhancedLiveTranscript = ({ transcript, interimText, isTranscribing, status, error }) => {
  const statusBadge = () => {
    if (error) {
      return (
        <span className="ml-2 inline-flex items-center text-red-700 text-sm">
          <span className="w-2 h-2 bg-red-600 rounded-full mr-1"></span>
          Error
        </span>
      );
    }

    if (status === 'connected') {
      return (
        <span className="ml-2 inline-flex items-center text-green-700 text-sm">
          <span className="w-2 h-2 bg-green-600 rounded-full mr-1 animate-pulse"></span>
          Active
        </span>
      );
    }

    if (status === 'connecting') {
      return (
        <span className="ml-2 inline-flex items-center text-blue-700 text-sm">
          <span className="w-2 h-2 bg-blue-500 rounded-full mr-1 animate-pulse"></span>
          Connecting
        </span>
      );
    }

    if (status === 'closed') {
      return (
        <span className="ml-2 inline-flex items-center text-gray-500 text-sm">
          <span className="w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
          Stopped
        </span>
      );
    }

    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
          </svg>
          Live Transcription
          {statusBadge()}
        </h2>
        {error && (
          <p className="mt-2 text-sm text-red-700">{error}</p>
        )}
      </div>

      <div className="space-y-4">
        {transcript && (
          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
              {transcript}
            </p>
          </div>
        )}

        {interimText && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-blue-700 leading-relaxed whitespace-pre-wrap italic opacity-75">
              {interimText}
            </p>
          </div>
        )}

        {!transcript && !interimText && isTranscribing && (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <div className="flex justify-center mb-3">
              <svg className="w-8 h-8 text-gray-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4" />
              </svg>
            </div>
            <p className="text-gray-500">Listening... Start speaking to see transcription</p>
          </div>
        )}

        {!isTranscribing && !transcript && (
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <p className="text-yellow-800 text-sm">
              ℹ️ Transcription will appear here as you speak during the meeting
            </p>
          </div>
        )}
      </div>

      {transcript && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between text-xs text-gray-500">
            <span>{transcript.split(' ').length} words</span>
            <span>{Math.round(transcript.length / 5)} characters</span>
          </div>
        </div>
      )}
    </div>
  );
};
