import { useState, useEffect, useCallback } from "react";
import { meetingsAPI } from "../services/api";
import { useSocket } from "./useSocket";

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
      setError(err.response?.data?.message || "Failed to load meeting");
    } finally {
      setLoading(false);
    }
  };

  // Socket event handlers
  useEffect(() => {
    if (!socket || !meetingId) return;

    emit("join-meeting", { meetingId });

    const unsubscribeTranscript = on("transcript-interim", (data) => {
      if (data.meetingId === meetingId) {
        setMeeting((prev) => ({
          ...prev,
          transcript: data.fullTranscript,
          interimText: data.text,
        }));
      }
    });

    const unsubscribeFinal = on("transcript-final", (data) => {
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

  const startTranscription = useCallback(
    (language = "en") => {
      if (socket && meetingId) {
        emit("start-transcription", { meetingId, language });
      }
    },
    [socket, meetingId, emit]
  );

  const stopTranscription = useCallback(() => {
    if (socket) {
      emit("stop-transcription");
    }
  }, [socket, emit]);

  const saveTranscript = async (transcript) => {
    if (!meetingId) {
      console.error("No meeting ID available");
      return {
        success: false,
        message: "Cannot save transcript: No active meeting",
      };
    }

    if (!transcript || transcript.trim().length === 0) {
      console.warn("Empty transcript, skipping save");
      return {
        success: false,
        message: "Empty transcript",
      };
    }

    try {
      console.log(
        `Saving transcript for meeting ${meetingId}, length: ${transcript.length}`
      );

      await meetingsAPI.updateTranscript(meetingId, transcript);

      console.log("✅ Transcript saved successfully");

      setMeeting((prev) => ({ ...prev, transcript }));
      return { success: true };
    } catch (err) {
      console.error(
        "Failed to save transcript:",
        err.response?.data || err.message
      );
      return {
        success: false,
        message: err.response?.data?.message || "Failed to save transcript",
      };
    }
  };

  const completeMeeting = async () => {
    try {
      console.log(`🏁 Completing meeting ${meetingId}...`);
      const response = await meetingsAPI.complete(meetingId);
      console.log("✅ Meeting completed successfully:", response.data);

      // Update local state with the completed meeting data
      setMeeting(response.data.meeting);

      // Also refresh from server to ensure we have latest data
      await loadMeeting();

      return { success: true, meeting: response.data.meeting };
    } catch (err) {
      console.error("❌ Failed to complete meeting:", err);
      return {
        success: false,
        message: err.response?.data?.message || "Failed to complete meeting",
      };
    }
  };

  return {
    meeting,
    loading,
    error,
    startTranscription,
    stopTranscription,
    saveTranscript,
    completeMeeting,
    refreshMeeting: loadMeeting,
  };
};
