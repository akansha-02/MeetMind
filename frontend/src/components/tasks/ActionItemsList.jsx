import { useState, useEffect } from 'react';
import { actionItemsAPI } from '../../services/api';
import { TaskCard } from './TaskCard';
import { Loading } from '../shared/Loading';

export const ActionItemsList = ({ meetingId, filters = {} }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(filters.status || 'all');

  useEffect(() => {
    loadTasks();
  }, [meetingId, statusFilter]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const params = { ...filters };
      if (meetingId) params.meetingId = meetingId;
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await actionItemsAPI.getAll(params);
      setTasks(response.data.actionItems || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Action Items</h2>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-500">No action items found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <TaskCard key={task._id} task={task} onUpdate={loadTasks} />
          ))}
        </div>
      )}
    </div>
  );
};
