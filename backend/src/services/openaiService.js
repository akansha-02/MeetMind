import openai from "../config/openai.js";
import { chunkText } from "../utils/chunkText.js";

class OpenAIService {
  constructor() {
    this.client = openai;
  }

  // Generate meeting summary
  async generateSummary(transcript, language = "en") {
    try {
      if (!this.client) {
        throw new Error("OpenAI is not configured (missing OPENAI_API_KEY)");
      }
      const chunks = chunkText(transcript, 3000);
      const partialSummaries = [];

      for (const chunk of chunks) {
        const systemPrompt = `You are an AI assistant that creates concise meeting summaries.
  Focus on key decisions, topics discussed, and important points.
  Respond in ${language === "en" ? "English" : "the same language as the transcript"}.`;

        const userPrompt = `Summarize this part of the meeting transcript:\n\n${chunk}`;

        const response = await this.client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.5,
          max_tokens: 600,
        });

        partialSummaries.push(response.choices[0].message.content);
      }

      // Final merge summary
      const finalResponse = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Create a final concise meeting summary.",
          },
          { role: "user", content: partialSummaries.join("\n") },
        ],
        temperature: 0.4,
        max_tokens: 800,
      });

      const summary = finalResponse.choices[0].message.content.trim();
      console.log("✅ OpenAI summary generated successfully");
      return summary;
    } catch (error) {
      console.error("OpenAI summary generation error:", error);
      throw error; // IMPORTANT: let fallback handle it
    }
  }

  // Extract action items
  async extractActionItems(transcript, language = "en") {
    try {
      if (!this.client) {
        throw new Error("OpenAI is not configured (missing OPENAI_API_KEY)");
      }
      const systemPrompt = `You are an AI assistant that extracts action items from meeting transcripts.
Extract all actionable tasks mentioned in the meeting.
For each action item, identify:
- Title/description
- Assignee (if mentioned)
- Due date (if mentioned)
- Priority (if mentioned, otherwise default to medium)

Return the response as a JSON array of objects with the following structure:
[
  {
    "title": "Task description",
    "description": "Additional details",
    "assignee": "Person name or null",
    "dueDate": "YYYY-MM-DD or null",
    "priority": "low|medium|high"
  }
]
Respond in valid JSON format only.`;

      const userPrompt = `Extract action items from this meeting transcript:\n\n${transcript}`;

      const response = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) return [];

      try {
        const parsed = JSON.parse(content);
        // Handle both { actionItems: [...] } and [...] formats
        const items = parsed.actionItems || parsed;
        return Array.isArray(items) ? items : [];
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        return [];
      }
    } catch (error) {
      console.error("OpenAI action item extraction error:", error);
      throw new Error(`Action item extraction failed: ${error.message}`);
    }
  }

  // Generate meeting minutes
  async generateMinutes(transcript, summary, language = "en") {
    try {
      if (!this.client) {
        throw new Error("OpenAI is not configured (missing OPENAI_API_KEY)");
      }
      const systemPrompt = `You are an AI assistant that creates formal meeting minutes.
Create well-structured meeting minutes with sections for:
- Meeting Overview
- Attendees (if mentioned)
- Agenda Items
- Discussion Points
- Decisions Made
- Action Items Summary
- Next Steps

Format the minutes professionally. Respond in ${language === "en" ? "English" : "the same language as the transcript"}.`;

      const userPrompt = `Create meeting minutes from this transcript and summary:\n\nTranscript:\n${transcript}\n\nSummary:\n${summary}`;

      const response = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      return response.choices[0]?.message?.content?.trim() || "";
    } catch (error) {
      console.error("OpenAI minutes generation error:", error);
      throw new Error(`Minutes generation failed: ${error.message}`);
    }
  }

  //   // Generate enhanced summary with flow diagrams
  //   async generateSummaryWithDiagrams(transcript, language = 'en') {
  //     try {
  //       const systemPrompt = `You are an AI assistant that creates comprehensive meeting summaries with visual flow diagrams.
  // Generate a clear, structured summary of the meeting transcript and create a Mermaid flowchart diagram.

  // For the summary, focus on:
  // - Key decisions made
  // - Main topics discussed
  // - Important points and outcomes
  // - Action items (if any)

  // For the flowchart, create a Mermaid diagram showing:
  // - The flow of discussion topics
  // - Decision points
  // - Outcomes or conclusions
  // - Use proper Mermaid syntax (flowchart TD or LR)

  // Format your response as JSON with this structure:
  // {
  //   "summary": "Text summary here",
  //   "flowDiagram": "mermaid flowchart syntax here",
  //   "summaryWithDiagrams": "Combined text with embedded diagram references"
  // }

  // The Mermaid diagram should use proper syntax like:
  // \`\`\`mermaid
  // flowchart TD
  //     A[Start] --> B[Topic 1]
  //     B --> C[Decision]
  //     C --> D[Outcome]
  // \`\`\`

  // Respond in ${language === 'en' ? 'English' : 'the same language as the transcript'}.`;

  //       const userPrompt = `Please create a comprehensive summary with flow diagram for this transcript:\n\n${transcript}`;

  //       const response = await this.client.chat.completions.create({
  //         model: 'gpt-4.1',
  //         messages: [
  //           { role: 'system', content: systemPrompt },
  //           { role: 'user', content: userPrompt },
  //         ],
  //         temperature: 0.7,
  //         max_tokens: 3000,
  //         response_format: { type: 'json_object' },
  //       });

  //       const content = response.choices[0]?.message?.content?.trim();
  //       if (!content) {
  //         throw new Error('No content generated');
  //       }

  //       try {
  //         const parsed = JSON.parse(content);
  //         return {
  //           summary: parsed.summary || '',
  //           flowDiagram: parsed.flowDiagram || '',
  //           summaryWithDiagrams: parsed.summaryWithDiagrams || parsed.summary || '',
  //         };
  //       } catch (parseError) {
  //         console.error('JSON parse error:', parseError);
  //         // Fallback to regular summary
  //         const fallbackSummary = await this.generateSummary(transcript, language);
  //         return {
  //           summary: fallbackSummary,
  //           flowDiagram: '',
  //           summaryWithDiagrams: fallbackSummary,
  //         };
  //       }
  //     }catch (error) {
  //         console.error('OpenAI summary with diagrams generation error:', error);
  //         throw new Error(`Summary with diagrams generation failed: ${error.message}`);
  //       }
  //     }

  // Generate embeddings for vector search
  async generateEmbedding(text) {
    try {
      if (!this.client) {
        throw new Error("OpenAI is not configured (missing OPENAI_API_KEY)");
      }
      const response = await this.client.embeddings.create({
        model: "text-embedding-3-small",
        input: text.replace(/\n/g, " "),
      });

      return response.data[0]?.embedding || [];
    } catch (error) {
      console.error("OpenAI embedding generation error:", error);
      throw new Error(`Embedding generation failed: ${error.message}`);
    }
  }

  // Generate multiple embeddings (batch)
  async generateEmbeddings(texts) {
    try {
      if (!this.client) {
        throw new Error("OpenAI is not configured (missing OPENAI_API_KEY)");
      }
      const cleanedTexts = texts.map((text) => text.replace(/\n/g, " "));
      const response = await this.client.embeddings.create({
        model: "text-embedding-3-small",
        input: cleanedTexts,
      });

      return response.data.map((item) => item.embedding);
    } catch (error) {
      console.error("OpenAI batch embedding generation error:", error);
      throw new Error(`Batch embedding generation failed: ${error.message}`);
    }
  }
}

export default new OpenAIService();
