import { formatDate } from '../../utils/formatDate';

export const MeetingSummary = ({ meeting }) => {
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
          <h3 className="text-lg font-semibold mb-4">Summary</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{meeting.summary}</p>
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
