import { useState, useEffect, useCallback } from 'react';
import { meetingsAPI } from '../services/api';
import { useSocket } from './useSocket';

export const useMeeting = (meetingId) => {
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { socket, emit, on } = useSocket();

  useEffect(() => {
    if (meetingId) {
      loadMeeting();
    } else {
      setLoading(false);
    }
  }, [meetingId]);

  const loadMeeting = async () => {
    try {
      setLoading(true);
      const response = await meetingsAPI.getById(meetingId);
      setMeeting(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load meeting');
    } finally {
      setLoading(false);
    }
  };

  // Socket event handlers
  useEffect(() => {
    if (!socket || !meetingId) return;

    emit('join-meeting', { meetingId });

    const unsubscribeTranscript = on('transcript-interim', (data) => {
      if (data.meetingId === meetingId) {
        setMeeting((prev) => ({
          ...prev,
          transcript: data.fullTranscript,
          interimText: data.text,
        }));
      }
    });

    const unsubscribeFinal = on('transcript-final', (data) => {
      if (data.meetingId === meetingId) {
        setMeeting((prev) => ({
          ...prev,
          transcript: data.fullTranscript,
          interimText: null,
        }));
        loadMeeting(); // Refresh from server
      }
    });

    return () => {
      if (unsubscribeTranscript) unsubscribeTranscript();
      if (unsubscribeFinal) unsubscribeFinal();
    };
  }, [socket, meetingId, emit, on]);

  const startTranscription = useCallback((language = 'en') => {
    if (socket && meetingId) {
      emit('start-transcription', { meetingId, language });
    }
  }, [socket, meetingId, emit]);

  const stopTranscription = useCallback(() => {
    if (socket) {
      emit('stop-transcription');
    }
  }, [socket, emit]);

  const completeMeeting = async () => {
    try {
      const response = await meetingsAPI.complete(meetingId);
      setMeeting(response.data.meeting);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to complete meeting',
      };
    }
  };

  return {
    meeting,
    loading,
    error,
    startTranscription,
    stopTranscription,
    completeMeeting,
    refreshMeeting: loadMeeting,
  };
};
