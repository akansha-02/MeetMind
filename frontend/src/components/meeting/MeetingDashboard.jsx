import React, { useState, useEffect, useCallback } from "react";
import { useEnhancedRecorder } from "../../hooks/useEnhancedRecorder";
import { useLiveTranscription } from "../../hooks/useLiveTranscription";
import { EnhancedLiveTranscript } from "./EnhancedLiveTranscript";
import { EnhancedMeetingControls } from "./EnhancedMeetingControls";
import { AudioUploader } from "./AudioUploader";
import { MeetingSummary } from "./MeetingSummary";
import { useMeeting } from "../../hooks/useMeeting";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

export const MeetingDashboard = ({ meetingId }) => {
  const { user } = useAuth();
  const { meeting, loading, saveTranscript, completeMeeting } =
    useMeeting(meetingId);
  const {
    isRecording,
    error: recorderError,
    startRecording,
    stopRecording,
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

      // Start recording without screen share
      await startRecording(false, false);

      // Use microphone audio for transcription
      await startLiveTranscription(audioStream, meeting?.language || "en");

      toast.success("Recording started with live transcription");
    } catch (err) {
      stopRecording();
      stopLiveTranscription();
      cleanupRecorder();
      if (err.name !== "NotAllowedError") {
        toast.error(`Failed to start recording: ${err.message}`);
      }
    }
  }, [
    startRecording,
    startLiveTranscription,
    meeting?.language,
    stopRecording,
    stopLiveTranscription,
    cleanupRecorder,
  ]);

  const handleStopRecording = useCallback(async () => {
    try {
      // 1. Capture the current transcript BEFORE stopping
      const transcriptToSave = transcript;

      console.log(
        "Stopping recording with transcript length:",
        transcriptToSave?.length || 0
      );

      // 2. Stop recording and transcription
      stopRecording();
      stopLiveTranscription();
      cleanupRecorder();

      // 3. Save transcript to backend (only if there is content)
      if (transcriptToSave && transcriptToSave.trim().length > 0) {
        console.log("Saving transcript to backend...");
        const result = await saveTranscript(transcriptToSave);
        if (result.success) {
          toast.success("Recording stopped and transcript saved!");
        } else {
          toast.error(
            result.message || "Recording stopped but failed to save transcript"
          );
        }
      } else {
        toast.success("Recording stopped!");
        console.warn("No transcript to save");
      }
    } catch (error) {
      console.error("Error stopping recording:", error);
      toast.error("Failed to stop recording properly");
    }
  }, [
    stopRecording,
    stopLiveTranscription,
    cleanupRecorder,
    transcript,
    saveTranscript,
  ]);

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

  // For invited users or when not recording, use transcript from meeting (updated via socket)
  // For active recorder, use local transcript state
  const displayTranscript = isRecording
    ? transcript
    : meeting?.transcript || "";
  const displayInterimText = isRecording
    ? interimText
    : meeting?.interimText || "";

  // Check if current user is the meeting owner
  const isOwner = user?._id === meeting?.userId;

  return (
    <div className="space-y-6">
      <MeetingSummary meeting={meeting} onSummaryUpdate={handleSummaryUpdate} />

      {meeting?.status === "active" && (
        <>
          {/* Show info banner for invited participants */}
          {!isOwner && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">
                👥 You're viewing this meeting as a participant. You can see
                live transcriptions and summaries.
              </p>
            </div>
          )}

          {recorderError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">⚠️ Recorder Error: {recorderError}</p>
            </div>
          )}

          {/* Only show controls to meeting owner */}
          {isOwner && (
            <EnhancedMeetingControls
              isRecording={isRecording}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
              onCompleteMeeting={completeMeeting}
              meetingStatus={meeting.status}
              transcriptionError={transcriptionError}
            />
          )}

          <EnhancedLiveTranscript
            transcript={displayTranscript}
            interimText={displayInterimText}
            isTranscribing={isTranscribing || !!displayTranscript}
            status={transcriptionStatus}
            error={transcriptionError}
          />
        </>
      )}

      {/* Show summary and transcript even when meeting is completed */}
      {meeting?.status === "completed" && (
        <EnhancedLiveTranscript
          transcript={meeting.transcript}
          interimText=""
          isTranscribing={false}
          status="closed"
          error={null}
        />
      )}

      {/* Only show AudioUploader to meeting owner */}
      {isOwner && (
        <AudioUploader
          meetingId={meetingId}
          onUploadComplete={() => {
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};
