import Meeting from '../models/Meeting.js';
import ActionItem from '../models/ActionItem.js';
import openaiService from '../services/openaiService.js';
import vectorService from '../services/vectorService.js';

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

    // Generate summary, action items, and minutes
    const [summary, actionItemsData, minutes] = await Promise.all([
      openaiService.generateSummary(meeting.transcript, meeting.language),
      openaiService.extractActionItems(meeting.transcript, meeting.language),
      Promise.resolve(null),
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

    // Store in vector database
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
    });
  } catch (error) {
    next(error);
  }
};
