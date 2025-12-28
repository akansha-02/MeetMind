import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { knowledgeBaseAPI } from "../../services/api";
import toast from "react-hot-toast";

export default function MonthlyKnowledgeBase() {
  const navigate = useNavigate();
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [meetings, setMeetings] = useState({});
  const [loading, setLoading] = useState(false);
  const [totalMeetings, setTotalMeetings] = useState(0);
  const [error, setError] = useState(null);

  // Track loaded data to prevent redundant calls
  const loadedDataRef = useRef({});
  const isFetchingRef = useRef(false);

  const fetchMonthlyMeetings = useCallback(async () => {
    const cacheKey = `${year}-${month}`;

    // Check if already loaded this month's data
    if (loadedDataRef.current[cacheKey]) {
      console.log(`📦 Using cached data for ${cacheKey}`);
      return;
    }

    // Prevent multiple simultaneous calls
    if (isFetchingRef.current) {
      console.log(`⏸️  Already fetching data, skipping duplicate call`);
      return;
    }

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      console.log(`📅 Fetching meetings for ${year}-${month}`);

      const response = await knowledgeBaseAPI.getMonthlyMeetings(year, month);

      console.log("✅ Monthly meetings response:", response.data);
      setMeetings(response.data.groupedByDate || {});
      setTotalMeetings(response.data.totalMeetings || 0);

      // Cache the successful response
      loadedDataRef.current[cacheKey] = true;

      if (response.data.totalMeetings > 0) {
        toast.success(
          `Loaded ${response.data.totalMeetings} meeting${
            response.data.totalMeetings > 1 ? "s" : ""
          }`
        );
      }
    } catch (error) {
      console.error("❌ Error fetching meetings:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to load monthly meetings";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [year, month]);

  useEffect(() => {
    fetchMonthlyMeetings();
  }, [fetchMonthlyMeetings]);

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

  // Manual refresh - clears cache and fetches fresh data
  const handleRefresh = useCallback(() => {
    const cacheKey = `${year}-${month}`;
    delete loadedDataRef.current[cacheKey];
    console.log(`🔄 Refreshing data for ${cacheKey}`);
    fetchMonthlyMeetings();
  }, [year, month, fetchMonthlyMeetings]);

  const monthName = new Date(year, month - 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Meeting Knowledge Base
            </h1>
            <p className="text-gray-600 mt-2">
              Search and browse all your completed meetings
            </p>
          </div>
        </div>

        {/* Navigation and Month Display */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevMonth}
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous Month
            </button>
            <div className="text-center flex-1 mx-4">
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  {monthName}
                </h2>
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition disabled:opacity-50"
                  title="Refresh data"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 mt-1">
                {totalMeetings} {totalMeetings === 1 ? "meeting" : "meetings"}
              </p>
            </div>
            <button
              onClick={handleNextMonth}
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
              <p className="text-gray-500 text-lg">
                No completed meetings found for {monthName}
              </p>
              <p className="text-gray-400 mt-1">
                Create and complete a meeting to see it here
              </p>
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
                  <h3 className="text-xl font-bold text-gray-900 ml-4">
                    {date}
                  </h3>
                  <span className="ml-auto px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {dateMeetings.length}{" "}
                    {dateMeetings.length === 1 ? "meeting" : "meetings"}
                  </span>
                </div>

                {/* Meetings Cards */}
                <div className="space-y-4 ml-4">
                  {dateMeetings.map((meeting) => (
                    <div
                      key={meeting._id}
                      onClick={() => navigate(`/meetings/${meeting._id}`)}
                      className="bg-white rounded-lg shadow hover:shadow-lg transition border border-gray-200 p-6 cursor-pointer"
                    >
                      {/* Title */}
                      <h4 className="text-lg font-bold text-gray-900 mb-2">
                        {meeting.title}
                      </h4>

                      {/* Time */}
                      <p className="text-sm text-gray-500 mb-3">
                        {new Date(meeting.startTime).toLocaleTimeString(
                          "en-US",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          }
                        )}
                        {meeting.endTime && (
                          <>
                            {" - "}
                            {new Date(meeting.endTime).toLocaleTimeString(
                              "en-US",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              }
                            )}
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
                          <button
                            onClick={() => navigate(`/meetings/${meeting._id}`)}
                            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-medium text-sm"
                          >
                            View Details
                          </button>
                          {meeting.transcript && (
                            <button
                              onClick={() =>
                                navigate(`/meetings/${meeting._id}`)
                              }
                              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium text-sm"
                            >
                              View Transcript
                            </button>
                          )}
                        </div>

                        {/* Action Items Badge */}
                        {meeting.actionItems &&
                          meeting.actionItems.length > 0 && (
                            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                              📋 {meeting.actionItems.length} Action{" "}
                              {meeting.actionItems.length === 1
                                ? "Item"
                                : "Items"}
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
