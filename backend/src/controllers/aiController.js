import Meeting from '../models/Meeting.js';
import ActionItem from '../models/ActionItem.js';
import openaiService from '../services/openaiService.js';
import vectorService from '../services/vectorService.js';
import { generateMeetingSummary } from '../services/summaryService.js'; // ⬅️ NEW IMPORT

// @desc    Generate AI content for meeting
// @route   POST /api/ai/process/:meetingId
// @access  Private
export const processMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findOne({
      _id: req.params.meetingId,
      userId: req.user._id,
    });

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    if (!meeting.transcript) {
      return res.status(400).json({ message: 'No transcript available' });
    }

    // 🔹 Use OpenAI primary, Gemini fallback for SUMMARY only
    const { summary, provider } = await generateMeetingSummary(
      meeting.transcript,
      meeting.language
    );

    // 🔹 Keep OpenAI for action items & minutes (or later add fallback too)
    const [actionItemsData] = await Promise.all([
      openaiService.extractActionItems(meeting.transcript, meeting.language),
      // minutes moved below, to keep using summary
    ]);

    const generatedMinutes = await openaiService.generateMinutes(
      meeting.transcript,
      summary,
      meeting.language
    );

    // Update meeting
    meeting.summary = summary;
    meeting.minutes = generatedMinutes;
    await meeting.save();

    // Create action items
    const actionItems = [];
    for (const itemData of actionItemsData) {
      const actionItem = await ActionItem.create({
        meetingId: meeting._id,
        userId: req.user._id,
        title: itemData.title || 'Untitled Task',
        description: itemData.description || '',
        assignee: itemData.assignee || null,
        dueDate: itemData.dueDate ? new Date(itemData.dueDate) : null,
        priority: itemData.priority || 'medium',
      });
      actionItems.push(actionItem);
    }

    // Store in vector database (non‑critical)
    try {
      await vectorService.storeMeetingContent(
        meeting._id,
        req.user._id,
        meeting.transcript,
        summary,
        generatedMinutes,
        actionItems
      );
    } catch (vectorError) {
      console.error('Vector storage error (non-critical):', vectorError);
    }

    res.json({
      meeting,
      actionItems,
      summary,
      minutes: generatedMinutes,
      provider, // 'openai' or 'gemini' (optional to send)
    });
  } catch (error) {
    next(error);
  }
};
