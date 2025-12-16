import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actionItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ActionItem',
    },
    meetingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meeting',
    },
    reminderDate: {
      type: Date,
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'sent', 'cancelled'],
      default: 'scheduled',
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
reminderSchema.index({ userId: 1, reminderDate: 1 });
reminderSchema.index({ status: 1, reminderDate: 1 });

const Reminder = mongoose.model('Reminder', reminderSchema);

export default Reminder;
