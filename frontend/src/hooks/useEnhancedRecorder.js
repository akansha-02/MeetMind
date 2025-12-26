import { useState, useRef, useCallback } from 'react';

export const useEnhancedRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [error, setError] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const canvasRef = useRef(null);
  const videoStreamRef = useRef(null);

  const startRecording = useCallback(async (captureScreen = false, captureSystemAudio = false) => {
    try {
      setError(null);

      // Get audio stream
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      audioStreamRef.current = audioStream;

      let combinedStream = new MediaStream();

      // Add audio tracks
      audioStream.getAudioTracks().forEach((track) => {
        combinedStream.addTrack(track);
      });

      // Get screen/window capture if enabled
      if (captureScreen) {
        try {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              cursor: 'always',
            },
            // When user checks "Share system audio" in the browser prompt,
            // this captures tab/system audio alongside video.
            audio: captureSystemAudio ? true : false,
          });
          screenStreamRef.current = screenStream;

          // Add video tracks
          screenStream.getVideoTracks().forEach((track) => {
            combinedStream.addTrack(track);
            
            // Handle screen sharing stop
            track.onended = () => {
              setScreenSharing(false);
              stopScreenShare();
            };
          });

          // If user opted to share system audio, merge those audio tracks
          if (captureSystemAudio) {
            screenStream.getAudioTracks().forEach((track) => {
              combinedStream.addTrack(track);
            });
          }

          setScreenSharing(true);
        } catch (err) {
          if (err.name !== 'NotAllowedError') {
            console.warn('Screen capture not available, continuing with audio only', err);
          }
          // Continue with audio-only if screen sharing is cancelled
        }
      }

      // Create media recorder with appropriate mime type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(combinedStream, { mimeType });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        audioStream.getTracks().forEach((track) => track.stop());
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach((track) => track.stop());
          screenStreamRef.current = null;
        }
      };

      mediaRecorder.start(1000); // Collect data every second
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      // Return the combined media stream so callers can use the same audio tracks (e.g., for transcription)
      return combinedStream;
    } catch (err) {
      setError(err.message);
      console.error('Error starting recording:', err);
      throw err;
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setScreenSharing(false);
    }
  }, [isRecording]);

  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
      setScreenSharing(false);
    }
  }, []);

  const getAudioBlob = useCallback(() => {
    if (audioChunksRef.current.length === 0) return null;
    return new Blob(audioChunksRef.current, { type: 'audio/webm' });
  }, []);

  const getAudioChunks = useCallback(() => {
    return audioChunksRef.current;
  }, []);

  const cleanup = useCallback(() => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current = null;
    }
    if (canvasRef.current) {
      canvasRef.current = null;
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setScreenSharing(false);
  }, []);

  return {
    isRecording,
    screenSharing,
    error,
    startRecording,
    stopRecording,
    stopScreenShare,
    getAudioBlob,
    getAudioChunks,
    cleanup,
  };
};
