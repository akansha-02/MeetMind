import React, { useState } from "react";
import { knowledgeBaseAPI } from "../../services/api";
import { formatDate } from "../../utils/formatDate";
import toast from "react-hot-toast";

export const SearchContext = ({ onSelectMeeting }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!query.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    setLoading(true);
    setResults([]); // Clear previous results
    setHasSearched(true); // Mark that a search has been performed

    try {
      console.log("🔍 Searching for:", query);
      const response = await knowledgeBaseAPI.search(query, 10);
      console.log("📊 Search response:", response.data);

      const searchResults = response.data.results || [];
      setResults(searchResults);

      if (searchResults.length === 0) {
        toast(
          "No results found. Try different keywords or check if you have completed meetings."
        );
      } else {
        toast.success(
          `Found ${searchResults.length} result${
            searchResults.length > 1 ? "s" : ""
          }`
        );
      }
    } catch (error) {
      console.error("❌ Search error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Search failed. Please try again.";
      toast.error(errorMessage);
      setResults([]);
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
          placeholder="Search your meetings... (e.g., 'budget discussion', 'sprint planning')"
          className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {!hasSearched && !loading && (
        <div className="text-center py-8 text-gray-500">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <p className="mt-2">Enter a search query to find relevant meetings</p>
        </div>
      )}

      {hasSearched && !loading && results.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="mt-2">No results found</p>
          <p className="text-sm mt-1">
            Try different keywords or complete some meetings first
          </p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Search Results</h3>
          <div className="space-y-2">
            {results.map((result, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  const meetingId = result.meeting?._id || result.meetingId;
                  if (meetingId) {
                    onSelectMeeting && onSelectMeeting(meetingId);
                  }
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-900">
                    {result.meeting?.title ||
                      result.metadata?.title ||
                      "Meeting"}
                  </h4>
                  <div className="text-right">
                    {result.meeting?.startTime && (
                      <span className="text-sm text-gray-500 block">
                        {formatDate(result.meeting.startTime)}
                      </span>
                    )}
                    {result.score && (
                      <span className="text-xs text-gray-400">
                        Match: {(result.score * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-gray-600 text-sm line-clamp-3">
                  {result.content}
                </p>
                <div className="mt-2 text-xs text-gray-500">
                  <span className="inline-block bg-gray-100 px-2 py-1 rounded mr-2">
                    {result.contentType || "content"}
                  </span>
                  {result.meeting?.participants?.length > 0 && (
                    <span className="inline-block">
                      {result.meeting.participants.length} participants
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
