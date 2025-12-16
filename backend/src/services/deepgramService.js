import deepgram from '../config/deepgram.js';
import fs from 'fs/promises';

class DeepgramService {
  constructor() {
    this.client = deepgram;
  }

  // Transcribe audio file
  async transcribeFile(audioFilePath, options = {}) {
    try {
      const {
        language = 'en',
        model = 'nova-2',
        punctuate = true,
        diarize = false,
        paragraphs = false,
      } = options;

      // Read file as buffer
      const audioBuffer = await fs.readFile(audioFilePath);

      const { result, error } = await this.client.listen.prerecorded.transcribeFile(
        audioBuffer,
        {
          model,
          language,
          punctuate,
          diarize,
          paragraphs,
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      if (result?.results?.channels?.[0]?.alternatives?.[0]?.transcript) {
        return {
          transcript: result.results.channels[0].alternatives[0].transcript,
          confidence: result.results.channels[0].alternatives[0].confidence,
          language: result.results.language || language,
          metadata: result.metadata,
        };
      }

      return { transcript: '', confidence: 0, language };
    } catch (error) {
      console.error('Deepgram transcription error:', error);
      throw new Error(`Transcription failed: ${error.message}`);
    }
  }

  // Transcribe audio buffer
  async transcribeBuffer(audioBuffer, options = {}) {
    try {
      const {
        language = 'en',
        model = 'nova-2',
        punctuate = true,
        diarize = false,
      } = options;

      const { result, error } = await this.client.listen.prerecorded.transcribeFile(
        audioBuffer,
        {
          model,
          language,
          punctuate,
          diarize,
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      if (result?.results?.channels?.[0]?.alternatives?.[0]?.transcript) {
        return {
          transcript: result.results.channels[0].alternatives[0].transcript,
          confidence: result.results.channels[0].alternatives[0].confidence,
          language: result.results.language || language,
        };
      }

      return { transcript: '', confidence: 0, language };
    } catch (error) {
      console.error('Deepgram transcription error:', error);
      throw new Error(`Transcription failed: ${error.message}`);
    }
  }

  // Create live transcription connection
  createLiveConnection(options = {}) {
    const {
      language = 'en',
      model = 'nova-2',
      punctuate = true,
      interim_results = true,
      endpointing = 300,
    } = options;

    const connection = this.client.listen.live({
      model,
      language,
      punctuate,
      interim_results,
      endpointing,
    });

    return connection;
  }

  // Detect language from audio
  async detectLanguage(audioFilePath) {
    try {
      const audioBuffer = await fs.readFile(audioFilePath);
      const { result, error } = await this.client.listen.prerecorded.transcribeFile(
        audioBuffer,
        {
          detect_language: true,
        }
      );

      if (error) {
        console.error('Language detection error:', error);
        return 'en';
      }

      return result?.results?.language || 'en';
    } catch (error) {
      console.error('Language detection error:', error);
      return 'en'; // Default to English
    }
  }
}

export default new DeepgramService();
