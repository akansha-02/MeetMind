import React from 'react';
import { useParams } from 'react-router-dom';
import { MeetingDashboard } from '../components/meeting/MeetingDashboard';
import { ActionItemsList } from '../components/tasks/ActionItemsList';
import { Loading } from '../components/shared/Loading';

export const MeetingDetail = () => {
  const { id } = useParams();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <MeetingDashboard meetingId={id} />
      {/* <ActionItemsList meetingId={id} /> */}
    </div>
  );
};
