import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a meeting title'],
      trim: true,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
    },
    language: {
      type: String,
      default: 'en',
    },
    transcript: {
      type: String,
      default: '',
    },
    summary: {
      type: String,
      default: '',
    },
    minutes: {
      type: String,
      default: '',
    },
    participants: [
      {
        email: { type: String, required: true, trim: true },
        name: { type: String, trim: true },
        status: {
          type: String,
          enum: ['invited', 'accepted', 'declined'],
          default: 'invited',
        },
      },
    ],
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
meetingSchema.index({ userId: 1, createdAt: -1 });
meetingSchema.index({ status: 1 });

const Meeting = mongoose.model('Meeting', meetingSchema);

export default Meeting;
