import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { meetingsAPI } from '../services/api';
import { formatDate } from '../utils/formatDate';
import { Loading } from '../components/shared/Loading';
import toast from 'react-hot-toast';

export const Dashboard = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMeetingTitle, setNewMeetingTitle] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      const response = await meetingsAPI.getAll({ limit: 50 });
      setMeetings(response.data.meetings || []);
    } catch (error) {
      toast.error('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    if (!newMeetingTitle.trim()) {
      toast.error('Please enter a meeting title');
      return;
    }

    try {
      const response = await meetingsAPI.create({ title: newMeetingTitle });
      toast.success('Meeting created!');
      setShowCreateForm(false);
      setNewMeetingTitle('');
      loadMeetings();
      // Navigate to the new meeting
      window.location.href = `/meetings/${response.data._id}`;
    } catch (error) {
      toast.error('Failed to create meeting');
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Meetings</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          {showCreateForm ? 'Cancel' : '+ New Meeting'}
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={handleCreateMeeting}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Title
              </label>
              <input
                type="text"
                value={newMeetingTitle}
                onChange={(e) => setNewMeetingTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter meeting title..."
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
            >
              Create Meeting
            </button>
          </form>
        </div>
      )}

      {meetings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-500 mb-4">No meetings yet</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
          >
            Create Your First Meeting
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meetings.map((meeting) => (
            <Link
              key={meeting._id}
              to={`/meetings/${meeting._id}`}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-semibold mb-2">{meeting.title}</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    meeting.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {meeting.status}
                  </span>
                </div>
                {meeting.startTime && (
                  <div className="flex justify-between">
                    <span>Started:</span>
                    <span>{formatDate(meeting.startTime)}</span>
                  </div>
                )}
                {meeting.language && (
                  <div className="flex justify-between">
                    <span>Language:</span>
                    <span className="uppercase">{meeting.language}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
