import Meeting from '../models/Meeting.js';
import deepgramService from '../services/deepgramService.js';
import { validateAudioFile } from '../utils/audioProcessor.js';

// @desc    Transcribe uploaded audio file
// @route   POST /api/transcripts/upload
// @access  Private
export const uploadAndTranscribe = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No audio file provided' });
    }

    const validation = validateAudioFile(req.file);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.error });
    }

    const { meetingId, language = 'en' } = req.body;

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

    // Transcribe audio file
    const transcriptionResult = await deepgramService.transcribeFile(
      req.file.path,
      { language }
    );

    // Update meeting with transcript
    meeting.transcript = transcriptionResult.transcript;
    meeting.language = transcriptionResult.language || language;
    meeting.metadata = {
      ...meeting.metadata,
      transcriptionConfidence: transcriptionResult.confidence,
      transcriptionMetadata: transcriptionResult.metadata,
    };
    await meeting.save();

    res.json({
      meeting,
      transcript: transcriptionResult.transcript,
      confidence: transcriptionResult.confidence,
      language: transcriptionResult.language,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get transcription for a meeting
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
      language: meeting.language,
      meetingId: meeting._id,
    });
  } catch (error) {
    next(error);
  }
};
