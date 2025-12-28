import Meeting from "../models/Meeting.js";
import ActionItem from "../models/ActionItem.js";
import openaiService from "../services/openaiService.js";
import vectorService from "../services/vectorService.js";
import knowledgeBaseService from "../services/knowledgeBaseService.js";
import { generateMeetingSummary } from "../services/summaryService.js";
import { generateMinutesWithGemini } from "../services/geminiService.js";
import emailService from "../services/emailService.js";

// @desc    Get all meetings for user
// @route   GET /api/meetings
// @access  Private
export const getMeetings = async (req, res, next) => {
  try {
    const { status, limit = 50, skip = 0 } = req.query;
    const query = { userId: req.user._id };

    if (status) {
      query.status = status;
    }

    const meetings = await Meeting.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Meeting.countDocuments(query);

    res.json({
      meetings,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single meeting
// @route   GET /api/meetings/:id
// @access  Private
export const getMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // Check if user is owner or invited participant
    const isOwner = meeting.userId.toString() === req.user._id.toString();
    const isInvited = meeting.participants?.some(
      (p) => p.email.toLowerCase() === req.user.email.toLowerCase()
    );

    if (!isOwner && !isInvited) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(meeting);
  } catch (error) {
    next(error);
  }
};

// @desc    Create new meeting
// @route   POST /api/meetings
// @access  Private
export const createMeeting = async (req, res, next) => {
  try {
    const { title, language = "en", participants = [] } = req.body;

    // Normalize participants to { email, name?, status }
    const participantDocs = Array.isArray(participants)
      ? participants
          .filter((p) => p && p.email)
          .map((p) => ({
            email: p.email.trim(),
            name: p.name?.trim(),
            status: p.status || "invited",
          }))
      : [];

    const meeting = await Meeting.create({
      userId: req.user._id,
      title: title || `Meeting ${new Date().toLocaleString()}`,
      language,
      status: "active",
      startTime: new Date(),
      participants: participantDocs,
    });

    // 🔹 Send email invites
    const meetingLink = `${process.env.FRONTEND_URL}/meetings/${meeting._id}`;
    for (const participant of participantDocs) {
      emailService.sendMeetingInvite(
        participant.email,
        meeting.title,
        meetingLink,
        req.user.name
      );
    }

    res.status(201).json(meeting);
  } catch (error) {
    next(error);
  }
};

// @desc    Update meeting transcript
// @route   PUT /api/meetings/:id/transcript
// @access  Private
export const updateMeetingTranscript = async (req, res, next) => {
  try {
    const { transcript } = req.body;

    if (!transcript) {
      return res.status(400).json({ message: "Transcript is required" });
    }

    const meeting = await Meeting.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    meeting.transcript = transcript;
    await meeting.save();

    res.json({ message: "Transcript updated successfully", meeting });
  } catch (error) {
    next(error);
  }
};

// @desc    Update meeting
// @route   PUT /api/meetings/:id
// @access  Private
export const updateMeeting = async (req, res, next) => {
  try {
    const { title, transcript, status, language } = req.body;

    const meeting = await Meeting.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    if (title) meeting.title = title;
    if (transcript !== undefined) meeting.transcript = transcript;
    if (status) {
      meeting.status = status;
      // Auto-set endTime when marking as completed
      if (status === "completed" && !meeting.endTime) {
        meeting.endTime = new Date();
      }
    }
    if (language) meeting.language = language;

    await meeting.save();

    res.json(meeting);
  } catch (error) {
    next(error);
  }
};

// @desc    Generate / regenerate summary only
// @route   POST /api/meetings/:id/summary
// @access  Private
export const generateMeetingSummaryOnly = async (req, res, next) => {
  try {
    const meeting = await Meeting.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    if (!meeting.transcript) {
      return res.status(400).json({ message: "No transcript available" });
    }
    const { summary, provider } = await generateMeetingSummary(
      meeting.transcript,
      meeting.language
    );

    meeting.summary = summary;
    await meeting.save();

    res.json({ summary, provider });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete meeting
// @route   DELETE /api/meetings/:id
// @access  Private
export const deleteMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // Delete associated action items
    await ActionItem.deleteMany({ meetingId: req.params.id });

    res.json({ message: "Meeting deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete meeting and generate AI content
// @route   POST /api/meetings/:id/complete
// @access  Private
export const completeMeeting = async (req, res, next) => {
  try {
    console.log(`🏁 Completing meeting: ${req.params.id}`);

    const meeting = await Meeting.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    if (!meeting.transcript) {
      return res.status(400).json({ message: "No transcript available" });
    }

    console.log(`📝 Generating summary for meeting ${meeting._id}...`);

    // 🔹 Use OpenAI primary, Gemini fallback for SUMMARY
    const { summary, provider } = await generateMeetingSummary(
      meeting.transcript,
      meeting.language
    );

    // 🔹 Action items feature commented out
    // const [actionItemsData] = await Promise.all([
    //   openaiService.extractActionItems(meeting.transcript, meeting.language),
    // ]);

    // Generate minutes after summary is ready (non-critical)
    let generatedMinutes = "";
    try {
      generatedMinutes = await openaiService.generateMinutes(
        meeting.transcript,
        summary,
        meeting.language
      );
      console.log("✅ Minutes generated successfully with OpenAI");
    } catch (minutesError) {
      console.warn(
        "⚠️ OpenAI minutes generation failed, trying Gemini:",
        minutesError.message
      );

      // Try Gemini as fallback
      try {
        generatedMinutes = await generateMinutesWithGemini(
          meeting.transcript,
          summary,
          meeting.language
        );
        console.log("✅ Minutes generated successfully with Gemini");
      } catch (geminiError) {
        console.warn(
          "⚠️ Gemini minutes generation also failed (non-critical):",
          geminiError.message
        );
        // Continue without minutes - it's not critical for meeting completion
      }
    }

    // Update meeting
    meeting.summary = summary;
    meeting.minutes = generatedMinutes;
    meeting.status = "completed";
    meeting.endTime = new Date();
    await meeting.save();

    console.log(`✅ Meeting ${meeting._id} completed successfully`);
    console.log(`   Status: ${meeting.status}`);
    console.log(`   EndTime: ${meeting.endTime}`);
    console.log(`   Provider: ${provider}`);

    // ✅ Store meeting with embeddings
    try {
      await knowledgeBaseService.storeMeetingSummary(
        meeting._id,
        summary,
        meeting.transcript
      );
    } catch (embeddingError) {
      console.error("Embedding storage error (non-critical):", embeddingError);
      // Don't fail the request if embedding storage fails
    }

    // Create action items - COMMENTED OUT
    // const actionItems = [];
    // for (const itemData of actionItemsData) {
    //   const actionItem = await ActionItem.create({
    //     meetingId: meeting._id,
    //     userId: req.user._id,
    //     title: itemData.title || 'Untitled Task',
    //     description: itemData.description || '',
    //     assignee: itemData.assignee || null,
    //     dueDate: itemData.dueDate ? new Date(itemData.dueDate) : null,
    //     priority: itemData.priority || 'medium',
    //   });
    //   actionItems.push(actionItem);
    // }

    // Store content in vector database
    try {
      await vectorService.storeMeetingContent(
        meeting._id,
        req.user._id,
        meeting.transcript,
        summary,
        generatedMinutes,
        [] // empty action items array
      );
    } catch (vectorError) {
      console.error("Vector storage error (non-critical):", vectorError);
      // Don't fail the request if vector storage fails
    }

    res.json({
      meeting,
      // actionItems: [], // commented out
      provider,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Regenerate summary for a meeting
// @route   POST /api/meetings/:id/summary
// @access  Private
export const regenerateSummary = async (req, res, next) => {
  try {
    const meeting = await Meeting.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    if (!meeting.transcript) {
      return res
        .status(400)
        .json({ message: "No transcript available for summary generation" });
    }

    const { summary, provider } = await generateMeetingSummary(
      meeting.transcript,
      meeting.language
    );

    meeting.summary = summary;
    await meeting.save();

    res.json({
      summary,
      provider,
      message: "Summary regenerated successfully",
    });
  } catch (error) {
    console.error("Summary regeneration error:", error);
    next(error);
  }
};
