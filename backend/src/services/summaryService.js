import OpenAIService from "./openaiService.js";
import { summarizeWithHuggingFace } from "./huggingfaceService.js";
import { summarizeWithGemini } from "./geminiService.js";

// export async function generateSummarySafe(transcript, language = "en") {
//   try {
//     return {
//       summary: await OpenAIService.generateSummary(transcript, language),
//       source: "openai"
//     };
//   } catch (error) {
//     console.warn("OpenAI failed, using Hugging Face:", error.message);

//     return {
//       summary: await summarizeWithHuggingFace(transcript),
//       source: "huggingface"
//     };
//   }
// }

function isOpenAIQuotaError(error) {
  const status = error?.response?.status;
  const msg =
    error?.response?.data?.error?.message ||
    error?.message ||
    "";

  const lower = msg.toLowerCase();
  return (
    status === 429 ||
    lower.includes("quota") ||
    lower.includes("insufficient") ||
    lower.includes("rate limit")
  );
}

/**
 * Main function your routes should call.
 * 1. Try OpenAI (primary)
 * 2. If quota/rate-limit → fallback to Gemini
 */
export async function generateMeetingSummary(transcript, language = "en") {
  const text = (transcript || "").trim();
  if (!text) {
    throw new Error("Transcript is empty");
  }

  // 1) Try OpenAI first
  try {
    const summary = await OpenAIService.generateSummary(text, language);
    return { summary, provider: "openai" };
  } catch (error) {
    console.error("OpenAI summary failed:", error?.response?.data || error);

    if (!isOpenAIQuotaError(error)) {
      // Not a quota/rate limit issue – rethrow so you see real bugs
      throw error;
    }
  }

  // 2) Fallback to Gemini
  try {
    console.warn("Falling back to Gemini due to OpenAI quota issue.");
    const summary = await summarizeWithGemini(text, language);
    console.log('✅ Summary generation successful (provider: gemini)');
    return { summary, provider: "gemini" };
  } catch (error) {
    console.error("Gemini summary failed:", error?.response?.data || error);
    // Final fallback: Hugging Face (text summarization)
    try {
      const summary = await summarizeWithHuggingFace(text);
      console.log('✅ Summary generation successful (provider: huggingface)');
      return { summary, provider: "huggingface" };
    } catch (hfError) {
      console.error("Hugging Face summary failed:", hfError?.response?.data || hfError);
      throw hfError;
    }
  }
}
