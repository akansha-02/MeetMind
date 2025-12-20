import mongoose from 'mongoose';

const knowledgeBaseSchema = new mongoose.Schema(
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
    content: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    embedding: {
      type: [Number],
      default: [],
    },
    contentType: {
      type: String,
      enum: ['transcript', 'summary', 'minutes', 'action-item'],
      default: 'transcript',
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
knowledgeBaseSchema.index({ userId: 1, createdAt: -1 });
knowledgeBaseSchema.index({ meetingId: 1 });
knowledgeBaseSchema.index({ contentType: 1 });
knowledgeBaseSchema.index({ 'metadata.title': 1 });

const KnowledgeBase = mongoose.model('KnowledgeBase', knowledgeBaseSchema);

export default KnowledgeBase;
