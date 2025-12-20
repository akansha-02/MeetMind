import StandaloneSummary from '../models/StandaloneSummary.js';
import deepgramService from '../services/deepgramService.js';
import openaiService from '../services/openaiService.js';
import { generateMeetingSummary } from "../services/summaryService.js";
import { validateAudioFile } from '../utils/audioProcessor.js';

// @desc    Upload file and generate standalone summary
// @route   POST /api/summarize/upload
// @access  Private
export const uploadAndSummarize = async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No audio or video file provided' });
      }

      const validation = validateAudioFile(req.file);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.error });
    }

    const { language = 'en' } = req.body;

    // Transcribe audio/video file
    const transcriptionResult = await deepgramService.transcribeFile(
        req.file.path,
        { 
          language,
          paragraphs: true,
        }
      );

      if (!transcriptionResult.transcript) {
        return res.status(400).json({ message: 'Transcription failed or produced no content' });
      }
  
      // // Generate enhanced summary with diagrams
      // const summaryResult = await openaiService.generateSummaryWithDiagrams(
      //   transcriptionResult.transcript,
      //   language
      // );

      const transcript = transcriptionResult.transcript;

      // 2) Generate summary with OpenAI primary, Gemini fallback
    const { summary, provider } = await generateMeetingSummary(transcript, language);

      // Create standalone summary record
    const standaloneSummary = await StandaloneSummary.create({
        userId: req.user._id,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        transcript,
        summary,
        // summaryWithDiagrams: summaryResult.summaryWithDiagrams,
        // flowDiagram: summaryResult.flowDiagram,
        language: transcriptionResult.language || language,
        metadata: {
          transcriptionConfidence: transcriptionResult.confidence,
          transcriptionMetadata: transcriptionResult.metadata,
          summaryProvider: provider,
        },
      });
  
      res.json({
        success: true,
        summary: standaloneSummary,
      });
    } catch (error) {
      next(error);
    }
  };

// @desc    Get all standalone summaries for user
// @route   GET /api/summarize
// @access  Private
export const getSummaries = async (req, res, next) => {
    try {
      const summaries = await StandaloneSummary.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(50);
  
      res.json({
        summaries,
        total: summaries.length,
      });
    } catch (error) {
      next(error);
    }
  };

// @desc    Get single standalone summary
// @route   GET /api/summarize/:id
// @access  Private
export const getSummary = async (req, res, next) => {
    try {
      const summary = await StandaloneSummary.findOne({
        _id: req.params.id,
        userId: req.user._id,
      });
  
      if (!summary) {
        return res.status(404).json({ message: 'Summary not found' });
      }
  
      res.json(summary);
    } catch (error) {
      next(error);
    }
  };

// @desc    Delete standalone summary
// @route   DELETE /api/summarize/:id
// @access  Private
export const deleteSummary = async (req, res, next) => {
    try {
      const summary = await StandaloneSummary.findOneAndDelete({
        _id: req.params.id,
        userId: req.user._id,
      });
  
      if (!summary) {
        return res.status(404).json({ message: 'Summary not found' });
      }
  
      res.json({ message: 'Summary deleted successfully' });
    } catch (error) {
      next(error);
    }
};
