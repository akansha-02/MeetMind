import ActionItem from '../models/ActionItem.js';
import Meeting from '../models/Meeting.js';

// @desc    Get all action items for user
// @route   GET /api/action-items
// @access  Private
export const getActionItems = async (req, res, next) => {
  try {
    const { meetingId, status, priority, limit = 50, skip = 0 } = req.query;
    const query = { userId: req.user._id };

    if (meetingId) {
      query.meetingId = meetingId;
    }
    if (status) {
      query.status = status;
    }
    if (priority) {
      query.priority = priority;
    }

    const actionItems = await ActionItem.find(query)
      .populate('meetingId', 'title startTime')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await ActionItem.countDocuments(query);

    res.json({
      actionItems,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single action item
// @route   GET /api/action-items/:id
// @access  Private
export const getActionItem = async (req, res, next) => {
  try {
    const actionItem = await ActionItem.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).populate('meetingId');

    if (!actionItem) {
      return res.status(404).json({ message: 'Action item not found' });
    }

    res.json(actionItem);
  } catch (error) {
    next(error);
  }
};

// @desc    Create action item
// @route   POST /api/action-items
// @access  Private
export const createActionItem = async (req, res, next) => {
  try {
    const { meetingId, title, description, assignee, dueDate, priority } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    // Verify meeting belongs to user if meetingId provided
    if (meetingId) {
      const meeting = await Meeting.findOne({
        _id: meetingId,
        userId: req.user._id,
      });

      if (!meeting) {
        return res.status(404).json({ message: 'Meeting not found' });
      }
    }

    const actionItem = await ActionItem.create({
      meetingId,
      userId: req.user._id,
      title,
      description,
      assignee,
      dueDate: dueDate ? new Date(dueDate) : null,
      priority: priority || 'medium',
    });

    res.status(201).json(actionItem);
  } catch (error) {
    next(error);
  }
};

// @desc    Update action item
// @route   PUT /api/action-items/:id
// @access  Private
export const updateActionItem = async (req, res, next) => {
  try {
    const { title, description, assignee, dueDate, status, priority } = req.body;

    const actionItem = await ActionItem.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!actionItem) {
      return res.status(404).json({ message: 'Action item not found' });
    }

    if (title) actionItem.title = title;
    if (description !== undefined) actionItem.description = description;
    if (assignee !== undefined) actionItem.assignee = assignee;
    if (dueDate !== undefined) actionItem.dueDate = dueDate ? new Date(dueDate) : null;
    if (status) actionItem.status = status;
    if (priority) actionItem.priority = priority;

    await actionItem.save();

    res.json(actionItem);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete action item
// @route   DELETE /api/action-items/:id
// @access  Private
export const deleteActionItem = async (req, res, next) => {
  try {
    const actionItem = await ActionItem.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!actionItem) {
      return res.status(404).json({ message: 'Action item not found' });
    }

    res.json({ message: 'Action item deleted successfully' });
  } catch (error) {
    next(error);
  }
};
