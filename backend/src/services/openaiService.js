import openai from '../config/openai.js';

class OpenAIService {
  constructor() {
    this.client = openai;
  }

  // Generate meeting summary
  async generateSummary(transcript, language = 'en') {
    try {
      const systemPrompt = `You are an AI assistant that creates concise meeting summaries. 
Generate a clear, structured summary of the meeting transcript. 
Focus on key decisions, topics discussed, and important points.
Respond in ${language === 'en' ? 'English' : 'the same language as the transcript'}.`;

      const userPrompt = `Please summarize the following meeting transcript:\n\n${transcript}`;

      const response = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      return response.choices[0]?.message?.content?.trim() || '';
    } catch (error) {
      console.error('OpenAI summary generation error:', error);
      throw new Error(`Summary generation failed: ${error.message}`);
    }
  }

  // Extract action items
  async extractActionItems(transcript, language = 'en') {
    try {
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
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) return [];

      try {
        const parsed = JSON.parse(content);
        // Handle both { actionItems: [...] } and [...] formats
        const items = parsed.actionItems || parsed;
        return Array.isArray(items) ? items : [];
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return [];
      }
    } catch (error) {
      console.error('OpenAI action item extraction error:', error);
      throw new Error(`Action item extraction failed: ${error.message}`);
    }
  }

  // Generate meeting minutes
  async generateMinutes(transcript, summary, language = 'en') {
    try {
      const systemPrompt = `You are an AI assistant that creates formal meeting minutes.
Create well-structured meeting minutes with sections for:
- Meeting Overview
- Attendees (if mentioned)
- Agenda Items
- Discussion Points
- Decisions Made
- Action Items Summary
- Next Steps

Format the minutes professionally. Respond in ${language === 'en' ? 'English' : 'the same language as the transcript'}.`;

      const userPrompt = `Create meeting minutes from this transcript and summary:\n\nTranscript:\n${transcript}\n\nSummary:\n${summary}`;

      const response = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      return response.choices[0]?.message?.content?.trim() || '';
    } catch (error) {
      console.error('OpenAI minutes generation error:', error);
      throw new Error(`Minutes generation failed: ${error.message}`);
    }
  }

  // Generate embeddings for vector search
  async generateEmbedding(text) {
    try {
      const response = await this.client.embeddings.create({
        model: 'text-embedding-3-small',
        input: text.replace(/\n/g, ' '),
      });

      return response.data[0]?.embedding || [];
    } catch (error) {
      console.error('OpenAI embedding generation error:', error);
      throw new Error(`Embedding generation failed: ${error.message}`);
    }
  }

  // Generate multiple embeddings (batch)
  async generateEmbeddings(texts) {
    try {
      const cleanedTexts = texts.map(text => text.replace(/\n/g, ' '));
      const response = await this.client.embeddings.create({
        model: 'text-embedding-3-small',
        input: cleanedTexts,
      });

      return response.data.map(item => item.embedding);
    } catch (error) {
      console.error('OpenAI batch embedding generation error:', error);
      throw new Error(`Batch embedding generation failed: ${error.message}`);
    }
  }
}

export default new OpenAIService();
