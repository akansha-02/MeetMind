import React, { useEffect, useRef } from 'react';

export const LiveTranscript = ({ transcript = '', interimText = '' }) => {
  const transcriptEndRef = useRef(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, interimText]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 h-96 overflow-y-auto">
      <h3 className="text-lg font-semibold mb-4">Live Transcript</h3>
      <div className="space-y-2">
        {transcript && (
          <p className="text-gray-800 whitespace-pre-wrap">{transcript}</p>
        )}
        {interimText && (
          <p className="text-gray-500 italic">{interimText}</p>
        )}
        {!transcript && !interimText && (
          <p className="text-gray-400 italic">Transcript will appear here...</p>
        )}
        <div ref={transcriptEndRef} />
      </div>
    </div>
  );
};
