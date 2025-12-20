import { generateMeetingSummary } from "../services/summaryService.js";
import { summarizeWithHuggingFace } from "../services/huggingfaceService.js";

export async function generateSummary(text, language = "en") {
  try {
    const { summary } = await generateMeetingSummary(text, language);
    return summary;                 // OpenAI or Gemini
  } catch (err) {
    console.error("OpenAI + Gemini failed → using Hugging Face:", err.message);
    return await summarizeWithHuggingFace(text);
  }
}
