import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { LiveTranscript } from './LiveTranscript';
import { MeetingControls } from './MeetingControls';
import { AudioUploader } from './AudioUploader';
import { MeetingSummary } from './MeetingSummary';
import { useMeeting } from '../../hooks/useMeeting';

export const MeetingDashboard = ({ meetingId }) => {
  const { meeting, loading, startTranscription, stopTranscription, completeMeeting } = useMeeting(meetingId);
  const { socket, emit, on } = useSocket();
  const {
    isRecording,
    startRecording,
    stopRecording,
    sendAudioChunk,
    cleanup,
  } = useAudioRecorder();
  const [interimText, setInterimText] = useState('');

  // Handle transcription events
  useEffect(() => {
    if (!socket) return;

    const unsubscribeInterim = on('transcript-interim', (data) => {
      if (data.meetingId === meetingId) {
        setInterimText(data.text);
      }
    });

    const unsubscribeFinal = on('transcript-final', (data) => {
      if (data.meetingId === meetingId) {
        setInterimText('');
      }
    });

    return () => {
      if (unsubscribeInterim) unsubscribeInterim();
      if (unsubscribeFinal) unsubscribeFinal();
    };
  }, [socket, meetingId, on]);

  const handleStartRecording = useCallback(async () => {
    try {
      await startRecording();
      startTranscription(meeting?.language || 'en');
      
      // Set up audio chunk sending
      const mediaRecorder = navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        const recorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus',
        });

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0 && socket?.connected) {
            emit('audio-data', event.data);
          }
        };

        recorder.start(1000); // Send chunk every second
        return { recorder, stream };
      });
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }, [startRecording, startTranscription, meeting, socket, emit]);

  const handleStopRecording = useCallback(() => {
    stopRecording();
    stopTranscription();
    cleanup();
  }, [stopRecording, stopTranscription, cleanup]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const handleSummaryUpdate = (newSummary) => {
    // Refresh the meeting data to reflect the new summary
    window.location.reload();
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading meeting...</div>;
  }

  return (
    <div className="space-y-6">
      <MeetingSummary meeting={meeting} onSummaryUpdate={handleSummaryUpdate} />
      
      {meeting?.status === 'active' && (
        <>
          <MeetingControls
            isRecording={isRecording}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            onCompleteMeeting={completeMeeting}
            meetingStatus={meeting.status}
          />
          
          <LiveTranscript
            transcript={meeting.transcript || ''}
            interimText={interimText}
          />
        </>
      )}

      <AudioUploader
        meetingId={meetingId}
        onUploadComplete={() => {
          // Refresh meeting data
          window.location.reload();
        }}
      />
    </div>
  );
};
