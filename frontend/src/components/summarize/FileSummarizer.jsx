import React, { useState, useRef } from "react";
import { summarizeAPI } from "../../services/api";
import toast from "react-hot-toast";
// import { MermaidDiagram } from './MermaidDiagram';

export const FileSummarizer = () => {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [summary, setSummary] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = [
        "audio/mpeg",
        "audio/mp3",
        "audio/wav",
        "audio/webm",
        "audio/ogg",
        "audio/m4a",
        "video/mp4",
        "video/webm",
        "video/quicktime",
        "video/x-msvideo",
        "video/x-matroska",
        "video/ogg",
        "video/3gpp",
        "video/mpeg",
      ];

      if (!validTypes.includes(file.type)) {
        toast.error("Invalid file type. Please select an audio or video file.");
        return;
      }

      if (file.size > 100 * 1024 * 1024) {
        toast.error("File size exceeds 100MB limit");
        return;
      }

      setSelectedFile(file);
      setSummary(null); // Reset previous summary
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("language", "en");

      const response = await summarizeAPI.upload(formData);
      const provider = response.data.provider || "AI";
      toast.success(`Summarized successfully using ${provider.toUpperCase()}!`);
      setSummary(response.data.summary);
    } catch (error) {
      toast.error(error.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">
          Upload File for Summarization
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Audio or Video File
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,video/*"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            <p className="mt-1 text-xs text-gray-500">
              Supported formats: MP3, WAV, WebM, OGG, M4A, MP4, MOV, AVI, MKV
              (Max 100MB)
            </p>
          </div>

          {selectedFile && (
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm text-gray-700">
                Selected:{" "}
                <span className="font-medium">{selectedFile.name}</span>
              </p>
              <p className="text-xs text-gray-500">
                Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? "Uploading & Processing..." : "Upload & Summarize"}
          </button>
        </div>
      </div>

      {summary && (
        <div className="space-y-6">
          {/* Summary Text */}
          {summary.summary && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">Summary</h3>
              <div className="text-gray-700 whitespace-pre-wrap">
                {summary.summary}
              </div>
            </div>
          )}

          {/* Flow Diagram
          {summary.flowDiagram && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">Discussion Flow</h3>
              <MermaidDiagram diagram={summary.flowDiagram} id={summary._id} />
            </div>
          )} */}

          {/* Enhanced Summary with Diagrams
          {summary.summaryWithDiagrams && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">Detailed Summary</h3>
              <div className="text-gray-700 whitespace-pre-wrap">
                {summary.summaryWithDiagrams}
              </div>
            </div>
          )} */}

          {/* Full Transcript (Collapsible) */}
          {summary.transcript && (
            <details className="bg-white rounded-lg shadow-md p-6">
              <summary className="text-xl font-semibold cursor-pointer mb-4">
                Full Transcript
              </summary>
              <div className="text-gray-700 whitespace-pre-wrap max-h-96 overflow-y-auto mt-4">
                {summary.transcript}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
};
