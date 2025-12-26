import { useState, useRef, useCallback, useEffect } from 'react';

export const useLiveTranscription = (apiKey = null) => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | connecting | connected | closed | error

  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);

  const startTranscription = useCallback(
    async (audioStream, language = 'en') => {
      try {
        setError(null);
        setTranscript('');
        setInterimText('');
        setStatus('connecting');

        const key = apiKey || import.meta.env.VITE_DEEPGRAM_API_KEY;
        if (!key) {
          throw new Error('Deepgram API key not found');
        }

        const wsUrl = `wss://api.deepgram.com/v1/listen?model=nova-2&language=${language}&encoding=linear16&sample_rate=16000`;

        wsRef.current = new WebSocket(wsUrl, ['token', key]);

        wsRef.current.onopen = () => {
          console.log('[Deepgram] WebSocket connected');
          setIsTranscribing(true);
          setStatus('connected');
          setupAudioProcessing(audioStream);
        };

        wsRef.current.onmessage = (event) => {
          const data = JSON.parse(event.data);

          if (data.metadata?.request_id) {
            console.log('[Deepgram] request id:', data.metadata.request_id);
          }

          if (data.channel?.alternatives?.[0]?.transcript) {
            if (data.is_final) {
              setTranscript((prev) =>
                prev + (prev ? ' ' : '') + data.channel.alternatives[0].transcript
              );
              setInterimText('');
            } else {
              setInterimText(data.channel.alternatives[0].transcript);
            }
          }
        };

        wsRef.current.onerror = (wsError) => {
          console.error('[Deepgram] WebSocket error:', wsError);
          setError('Transcription error occurred');
          setStatus('error');
        };

        wsRef.current.onclose = (event) => {
          console.log('[Deepgram] WebSocket closed', event.code, event.reason);
          setIsTranscribing(false);
          setStatus('closed');
          // Only show error for abnormal closures (1000 = normal, 1005 = no status)
          if (event.code !== 1000 && event.code !== 1005) {
            setError(`Connection closed (${event.code}) ${event.reason || ''}`.trim());
          }
        };
      } catch (err) {
        setError(err.message);
        setStatus('error');
        console.error('Error starting transcription:', err);
      }
    },
    [apiKey]
  );

  const setupAudioProcessing = useCallback((audioStream) => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      const audioContext = audioContextRef.current;

      const source = audioContext.createMediaStreamSource(audioStream);

      const bufferSize = 4096;
      const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);

      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        const targetSampleRate = 16000;
        const sourceSampleRate = audioContext.sampleRate;

        let pcm16Data;
        if (sourceSampleRate !== targetSampleRate) {
          const sampleRateRatio = sourceSampleRate / targetSampleRate;
          const newLength = Math.round(input.length / sampleRateRatio);
          const downsampled = new Float32Array(newLength);
          let offsetResult = 0;
          let offsetBuffer = 0;
          while (offsetResult < downsampled.length) {
            const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
            let accum = 0;
            let count = 0;
            for (let i = offsetBuffer; i < nextOffsetBuffer && i < input.length; i++) {
              accum += input[i];
              count++;
            }
            downsampled[offsetResult] = accum / count;
            offsetResult++;
            offsetBuffer = nextOffsetBuffer;
          }
          pcm16Data = floatTo16BitPCM(downsampled);
        } else {
          pcm16Data = floatTo16BitPCM(input);
        }

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(pcm16Data.buffer);
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
    } catch (err) {
      console.error('Error setting up audio processing:', err);
      setError('Failed to set up audio processing');
      setStatus('error');
    }
  }, []);

  const floatTo16BitPCM = (input) => {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return output;
  };

  const stopTranscription = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsTranscribing(false);
    setStatus('closed');
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimText('');
  }, []);

  useEffect(() => {
    return () => {
      stopTranscription();
    };
  }, [stopTranscription]);

  return {
    isTranscribing,
    transcript,
    interimText,
    error,
    status,
    startTranscription,
    stopTranscription,
    clearTranscript,
  };
};
