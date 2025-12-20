import Meeting from '../models/Meeting.js';
import deepgramService from '../services/deepgramService.js';
import openaiService from '../services/openaiService.js';
import { validateAudioFile } from '../utils/audioProcessor.js';
import { generateMeetingSummary } from '../services/summaryService.js';

// @desc    Transcribe uploaded audio/video file and generate summary
// @route   POST /api/transcripts/upload
// @access  Private

export const uploadAndTranscribe = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No audio or video file provided' });
    }

    const validation = validateAudioFile(req.file);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.error });
    }

    const { meetingId, language = 'en', generateSummary = true } = req.body;

    // Create meeting if not provided
    let meeting;
    if (meetingId) {
      meeting = await Meeting.findOne({
        _id: meetingId,
        userId: req.user._id,
      });

      if (!meeting) {
        return res.status(404).json({ message: 'Meeting not found' });
      }
    } else {
      meeting = await Meeting.create({
        userId: req.user._id,
        title: `Meeting ${new Date().toLocaleString()}`,
        language,
        status: 'active',
        startTime: new Date(),
      });
    }

    // Transcribe audio/video file with paragraphs enabled
    const transcriptionResult = await deepgramService.transcribeFile(
      req.file.path,
      { 
        language,
        paragraphs: true, // Enable paragraphs for better formatting
      }
    );

    // Update meeting with transcript
    meeting.transcript = transcriptionResult.transcript;
    meeting.language = transcriptionResult.language || language;
    meeting.metadata = {
      ...meeting.metadata,
      transcriptionConfidence: transcriptionResult.confidence,
      transcriptionMetadata: transcriptionResult.metadata,
    };

        // Generate summary automatically if requested (OpenAI primary, Gemini fallback)
        let summary = null;
        let provider = null;
    
        if (generateSummary && transcriptionResult.transcript) {
          try {
            const result = await generateMeetingSummary(
              transcriptionResult.transcript,
              meeting.language
            );
            summary = result.summary;
            provider = result.provider; // 'openai' or 'gemini'
            meeting.summary = summary;
          } catch (summaryError) {
            console.error('Summary generation error:', summaryError);
            // Don't fail the request if summary generation fails
          }
        }
    

    
    // Mark meeting as completed since transcription is done
    meeting.status = 'completed';
    meeting.endTime = new Date();
    await meeting.save();

    res.json({
      meeting,
      transcript: transcriptionResult.transcript,
      summary: summary || meeting.summary,
      confidence: transcriptionResult.confidence,
      language: transcriptionResult.language,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get transcription and summary for a meeting
// @route   GET /api/transcripts/:meetingId
// @access  Private
export const getTranscription = async (req, res, next) => {
  try {
    const meeting = await Meeting.findOne({
      _id: req.params.meetingId,
      userId: req.user._id,
    });

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    res.json({
      transcript: meeting.transcript,
      summary: meeting.summary,
      minutes: meeting.minutes,
      language: meeting.language,
      meetingId: meeting._id,
    });
  } catch (error) {
    next(error);
  }
};