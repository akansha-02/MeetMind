import { useState } from 'react';
import { actionItemsAPI } from '../../services/api';
import { formatDate } from '../../utils/formatDate';
import toast from 'react-hot-toast';

export const TaskCard = ({ task, onUpdate }) => {
  const [status, setStatus] = useState(task.status);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus) => {
    setIsUpdating(true);
    try {
      await actionItemsAPI.update(task._id, { status: newStatus });
      setStatus(newStatus);
      if (onUpdate) onUpdate();
      toast.success('Task updated');
    } catch (error) {
      toast.error('Failed to update task');
    } finally {
      setIsUpdating(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
        <div className="flex space-x-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(status)}`}>
            {status}
          </span>
        </div>
      </div>

      {task.description && (
        <p className="text-gray-600 mb-4">{task.description}</p>
      )}

      <div className="flex flex-wrap gap-2 text-sm text-gray-500 mb-4">
        {task.assignee && (
          <span>Assignee: <span className="font-medium text-gray-700">{task.assignee}</span></span>
        )}
        {task.dueDate && (
          <span>Due: <span className="font-medium text-gray-700">{formatDate(task.dueDate)}</span></span>
        )}
        {task.meetingId?.title && (
          <span>Meeting: <span className="font-medium text-gray-700">{task.meetingId.title}</span></span>
        )}
      </div>

      <div className="flex space-x-2">
        {status !== 'completed' && (
          <>
            {status === 'pending' && (
              <button
                onClick={() => handleStatusChange('in-progress')}
                disabled={isUpdating}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50"
              >
                Start
              </button>
            )}
            {status === 'in-progress' && (
              <button
                onClick={() => handleStatusChange('completed')}
                disabled={isUpdating}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm disabled:opacity-50"
              >
                Complete
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
