import React, { useState } from 'react';

export const EnhancedMeetingControls = ({
  isRecording,
  screenSharing,
  onStartRecording,
  onStopRecording,
  onToggleScreenShare,
  onCompleteMeeting,
  meetingStatus,
  transcriptionError,
}) => {
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async () => {
    setIsCompleting(true);
    await onCompleteMeeting();
    setIsCompleting(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Error State */}
      {transcriptionError && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">⚠️ {transcriptionError}</p>
          <p className="text-xs text-yellow-600 mt-1">
            Recording will continue, but transcription may be unavailable.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-4">
        {/* Start/Stop Recording */}
        {!isRecording ? (
          <button
            onClick={() => onStartRecording(false)}
            className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                clipRule="evenodd"
              />
            </svg>
            Start Recording
          </button>
        ) : (
          <button
            onClick={onStopRecording}
            className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                clipRule="evenodd"
              />
            </svg>
            Stop Recording
          </button>
        )}

        {/* Screen Share Button */}
        {isRecording && (
          <button
            onClick={onToggleScreenShare}
            className={`flex items-center px-6 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition ${
              screenSharing
                ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200 focus:ring-blue-500'
            }`}
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" />
              <path
                fillRule="evenodd"
                d="M6.5 11a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm6 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
                clipRule="evenodd"
              />
            </svg>
            {screenSharing ? 'Stop Screen' : 'Share Screen'}
          </button>
        )}

        {/* Complete Meeting */}
        {meetingStatus === 'active' && (
          <button
            onClick={handleComplete}
            disabled={isCompleting || isRecording}
            className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCompleting ? 'Processing...' : 'Complete Meeting'}
          </button>
        )}
      </div>

      {/* Recording Indicator */}
      {isRecording && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-3">
            <span className="w-3 h-3 bg-red-600 rounded-full mr-2 animate-pulse"></span>
            <span className="text-red-600 font-medium">Recording in progress</span>
            {screenSharing && (
              <>
                <span className="text-gray-400">•</span>
                <span className="flex items-center text-blue-600 font-medium">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" />
                  </svg>
                  Screen sharing
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
