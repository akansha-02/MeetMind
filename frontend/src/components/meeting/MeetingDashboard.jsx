import React, { useState, useEffect, useCallback } from 'react';
import { useEnhancedRecorder } from '../../hooks/useEnhancedRecorder';
import { useLiveTranscription } from '../../hooks/useLiveTranscription';
import { EnhancedLiveTranscript } from './EnhancedLiveTranscript';
import { EnhancedMeetingControls } from './EnhancedMeetingControls';
import { AudioUploader } from './AudioUploader';
import { MeetingSummary } from './MeetingSummary';
import { useMeeting } from '../../hooks/useMeeting';
import toast from 'react-hot-toast';

export const MeetingDashboard = ({ meetingId }) => {
  const { meeting, loading, saveTranscript, completeMeeting } = useMeeting(meetingId);
  const {
    isRecording,
    screenSharing,
    error: recorderError,
    startRecording,
    stopRecording,
    stopScreenShare,
    cleanup: cleanupRecorder,
  } = useEnhancedRecorder();
  
  const {
    isTranscribing,
    transcript,
    interimText,
    error: transcriptionError,
    status: transcriptionStatus,
    startTranscription: startLiveTranscription,
    stopTranscription: stopLiveTranscription,
  } = useLiveTranscription();

  const [recordingStream, setRecordingStream] = useState(null);

  const handleStartRecording = useCallback(async () => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      setRecordingStream(audioStream);

      const shareScreen = window.confirm(
        'Would you like to share your screen? (You can cancel to record audio only)'
      );

      // Start recording with optional screen share (no system audio)
      await startRecording(shareScreen, false);

      // Use microphone audio for transcription
      await startLiveTranscription(audioStream, meeting?.language || 'en');

      toast.success('Recording started with live transcription');
    } catch (err) {
      stopRecording();
      stopLiveTranscription();
      cleanupRecorder();
      if (err.name !== 'NotAllowedError') {
        toast.error(`Failed to start recording: ${err.message}`);
      }
    }
  }, [startRecording, startLiveTranscription, meeting?.language, stopRecording, stopLiveTranscription, cleanupRecorder]);

  const handleStopRecording = useCallback(async () => {
    try {
      // 1. Capture the current transcript BEFORE stopping
      const transcriptToSave = transcript;
      
      console.log('Stopping recording with transcript length:', transcriptToSave?.length || 0);

      // 2. Stop recording and transcription
      stopRecording();
      stopLiveTranscription();
      cleanupRecorder();

      // 3. Save transcript to backend (only if there is content)
      if (transcriptToSave && transcriptToSave.trim().length > 0) {
        console.log('Saving transcript to backend...');
        const result = await saveTranscript(transcriptToSave);
        if (result.success) {
          toast.success('Recording stopped and transcript saved!');
        } else {
          toast.error(result.message || 'Recording stopped but failed to save transcript');
        }
      } else {
        toast.success('Recording stopped!');
        console.warn('No transcript to save');
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      toast.error('Failed to stop recording properly');
    }
  }, [stopRecording, stopLiveTranscription, cleanupRecorder, transcript, saveTranscript]);

  const handleToggleScreenShare = useCallback(async () => {
    if (screenSharing) {
      stopScreenShare();
      toast.info('Screen sharing stopped');
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' },
          audio: false,
        });
        toast.success('Screen sharing started');
      } catch (err) {
        if (err.name !== 'NotAllowedError') {
          toast.error('Failed to share screen');
        }
      }
    }
  }, [screenSharing, stopScreenShare]);

  useEffect(() => {
    return () => {
      cleanupRecorder();
      stopLiveTranscription();
    };
  }, [cleanupRecorder, stopLiveTranscription]);

  const handleSummaryUpdate = () => {
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
          {recorderError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">⚠️ Recorder Error: {recorderError}</p>
            </div>
          )}

          <EnhancedMeetingControls
            isRecording={isRecording}
            screenSharing={screenSharing}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            onToggleScreenShare={handleToggleScreenShare}
            onCompleteMeeting={completeMeeting}
            meetingStatus={meeting.status}
            transcriptionError={transcriptionError}
          />

          <EnhancedLiveTranscript
            transcript={transcript}
            interimText={interimText}
            isTranscribing={isTranscribing && isRecording}
            status={transcriptionStatus}
            error={transcriptionError}
          />
        </>
      )}

      <AudioUploader
        meetingId={meetingId}
        onUploadComplete={() => {
          window.location.reload();
        }}
      />
    </div>
  );
};
