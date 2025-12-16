import mongoose from 'mongoose';

const actionItemSchema = new mongoose.Schema(
  {
    meetingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meeting',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    assignee: {
      type: String,
      trim: true,
    },
    dueDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
actionItemSchema.index({ userId: 1, status: 1 });
actionItemSchema.index({ meetingId: 1 });
actionItemSchema.index({ dueDate: 1 });

const ActionItem = mongoose.model('ActionItem', actionItemSchema);

export default ActionItem;
