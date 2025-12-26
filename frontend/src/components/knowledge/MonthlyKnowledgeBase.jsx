import React,{ useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function MonthlyKnowledgeBase() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [meetings, setMeetings] = useState({});
  const [loading, setLoading] = useState(false);
  const [totalMeetings, setTotalMeetings] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMonthlyMeetings();
  }, [year, month]);

  const fetchMonthlyMeetings = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_API_URL}/knowledge-base/monthly/${year}/${month}`;
      console.log('Fetching from:', apiUrl);
      
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Response:', response.data);
      setMeetings(response.data.groupedByDate || {});
      setTotalMeetings(response.data.totalMeetings || 0);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      setError(error.response?.data?.error || 'Failed to load monthly meetings');
      toast.error('Failed to load monthly meetings');
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const monthName = new Date(year, month - 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Meeting Knowledge Base</h1>
            <p className="text-gray-600 mt-2">Search and browse all your completed meetings</p>
          </div>
        </div>

        {/* Navigation and Month Display */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevMonth}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
            >
              ← Previous Month
            </button>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">{monthName}</h2>
              <p className="text-gray-600 mt-1">
                {totalMeetings} {totalMeetings === 1 ? 'meeting' : 'meetings'}
              </p>
            </div>
            <button
              onClick={handleNextMonth}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
            >
              Next Month →
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
            <button
              onClick={fetchMonthlyMeetings}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-500 text-lg">Loading meetings...</p>
            </div>
          </div>
        ) : Object.keys(meetings).length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-lg shadow p-8">
            <div className="flex flex-col items-center justify-center py-12">
              <svg
                className="h-16 w-16 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-500 text-lg">No completed meetings found for {monthName}</p>
              <p className="text-gray-400 mt-1">Create and complete a meeting to see it here</p>
            </div>
          </div>
        ) : (
          /* Meetings List */
          <div className="space-y-6">
            {Object.entries(meetings).map(([date, dateMeetings]) => (
              <div key={date}>
                {/* Date Header */}
                <div className="flex items-center mb-4">
                  <div className="h-1 w-8 bg-blue-500 rounded"></div>
                  <h3 className="text-xl font-bold text-gray-900 ml-4">{date}</h3>
                  <span className="ml-auto px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {dateMeetings.length} {dateMeetings.length === 1 ? 'meeting' : 'meetings'}
                  </span>
                </div>

                {/* Meetings Cards */}
                <div className="space-y-4 ml-4">
                  {dateMeetings.map((meeting) => (
                    <div
                      key={meeting._id}
                      className="bg-white rounded-lg shadow hover:shadow-lg transition border border-gray-200 p-6"
                    >
                      {/* Title */}
                      <h4 className="text-lg font-bold text-gray-900 mb-2">
                        {meeting.title}
                      </h4>

                      {/* Time */}
                      <p className="text-sm text-gray-500 mb-3">
                        {new Date(meeting.startTime).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })}
                        {meeting.endTime && (
                          <>
                            {' - '}
                            {new Date(meeting.endTime).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </>
                        )}
                      </p>

                      {/* Summary */}
                      {meeting.summary && (
                        <div className="mb-4">
                          <p className="text-gray-700 line-clamp-3 bg-gray-50 p-3 rounded">
                            {meeting.summary}
                          </p>
                        </div>
                      )}

                      {/* Footer with Actions and Metadata */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex gap-2">
                          <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-medium text-sm">
                            View Details
                          </button>
                          {meeting.transcript && (
                            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium text-sm">
                              View Transcript
                            </button>
                          )}
                        </div>

                        {/* Action Items Badge */}
                        {meeting.actionItems && meeting.actionItems.length > 0 && (
                          <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                            📋 {meeting.actionItems.length} Action {meeting.actionItems.length === 1 ? 'Item' : 'Items'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
