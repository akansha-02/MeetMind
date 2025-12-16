import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-4">
            MeetMind
          </h1>
          <p className="text-xl text-indigo-100 mb-8">
            AI-Powered Meeting Assistant
          </p>
          <p className="text-lg text-white mb-12 max-w-2xl mx-auto">
            Transcribe meetings in real-time, generate summaries, extract action items,
            and build a searchable knowledge base of all your discussions.
          </p>

          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition"
            >
              Go to Dashboard
            </Link>
          ) : (
            <div className="space-x-4">
              <Link
                to="/login"
                className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="inline-block bg-indigo-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-800 transition"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="text-3xl mb-4">🎙️</div>
            <h3 className="text-xl font-semibold mb-2">Real-time Transcription</h3>
            <p className="text-gray-600">
              Transcribe your meetings live with multi-language support and high accuracy.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="text-3xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold mb-2">AI-Powered Insights</h3>
            <p className="text-gray-600">
              Automatically generate summaries, extract action items, and create meeting minutes.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="text-3xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">Knowledge Base</h3>
            <p className="text-gray-600">
              Search through past meetings with semantic search to find relevant context.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
