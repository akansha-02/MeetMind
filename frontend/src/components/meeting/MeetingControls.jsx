import React, { useState } from 'react';

export const MeetingControls = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  onCompleteMeeting,
  meetingStatus,
}) => {
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async () => {
    setIsCompleting(true);
    await onCompleteMeeting();
    setIsCompleting(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-center space-x-4">
        {!isRecording ? (
          <button
            onClick={onStartRecording}
            className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
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
            className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                clipRule="evenodd"
              />
            </svg>
            Stop Recording
          </button>
        )}

        {meetingStatus === 'active' && (
          <button
            onClick={handleComplete}
            disabled={isCompleting}
            className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCompleting ? 'Processing...' : 'Complete Meeting'}
          </button>
        )}
      </div>

      {isRecording && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center text-red-600">
            <span className="w-3 h-3 bg-red-600 rounded-full mr-2 animate-pulse"></span>
            Recording in progress...
          </div>
        </div>
      )}
    </div>
  );
};
