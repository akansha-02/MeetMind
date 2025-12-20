// src/services/geminiService.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not set – Gemini summarization will fail.");
} else {
  console.log("✅ GEMINI_API_KEY loaded, enabling Gemini summarization");
}

// IMPORTANT: use a valid model id
const MODEL_NAME = "gemini-pro"; // Using stable gemini-pro model

// Log once which model we are using
console.log("🔧 Gemini model configured:", MODEL_NAME);

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

export async function summarizeWithGemini(transcript, language = "en") {
  if (!genAI) {
    throw new Error("Gemini client not initialized");
  }

  console.log("▶️ summarizeWithGemini called, language:", language);

  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const prompt = `
You are an AI assistant that creates concise meeting summaries.
Focus on key decisions, topics discussed, and important points.
Respond in ${language === 'en' ? 'English' : 'the same language as the transcript'}.

Transcript:
${transcript}
  `.trim();

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  if (!text) {
    throw new Error("Gemini returned empty completion");
  }

  console.log("✅ Gemini summary generated successfully");
  return text.trim();
}
