import Reminder from '../models/Reminder.js';
import cron from 'node-cron';

class ReminderService {
  constructor() {
    this.scheduler = null;
  }

  // Start the reminder scheduler
  startScheduler() {
    // Run every minute to check for due reminders
    this.scheduler = cron.schedule('* * * * *', async () => {
      await this.checkAndSendReminders();
    });

    console.log('Reminder scheduler started');
  }

  // Stop the scheduler
  stopScheduler() {
    if (this.scheduler) {
      this.scheduler.stop();
      console.log('Reminder scheduler stopped');
    }
  }

  // Check and send due reminders
  async checkAndSendReminders() {
    try {
      const now = new Date();
      const dueReminders = await Reminder.find({
        status: 'scheduled',
        reminderDate: { $lte: now },
      })
        .populate('userId')
        .populate('actionItemId')
        .populate('meetingId');

      for (const reminder of dueReminders) {
        await this.sendReminder(reminder);
        reminder.status = 'sent';
        await reminder.save();
      }
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  }

  // Send a reminder (placeholder - implement actual notification logic)
  async sendReminder(reminder) {
    try {
      // TODO: Implement actual notification sending
      // Options: Email (nodemailer), Push notifications, In-app notifications, etc.
      console.log(`Sending reminder to user ${reminder.userId.email}:`, reminder.message);
      
      // For now, just log it
      // In production, you would:
      // - Send email via nodemailer or SendGrid
      // - Send push notification
      // - Store in-app notification
      // - etc.
      
      return true;
    } catch (error) {
      console.error('Error sending reminder:', error);
      throw error;
    }
  }

  // Create a reminder
  async createReminder(userId, actionItemId, meetingId, reminderDate, message) {
    try {
      const reminder = await Reminder.create({
        userId,
        actionItemId,
        meetingId,
        reminderDate,
        message,
        status: 'scheduled',
      });

      return reminder;
    } catch (error) {
      console.error('Error creating reminder:', error);
      throw new Error(`Failed to create reminder: ${error.message}`);
    }
  }

  // Get user's reminders
  async getUserReminders(userId, filters = {}) {
    try {
      const query = { userId };

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.actionItemId) {
        query.actionItemId = filters.actionItemId;
      }

      if (filters.meetingId) {
        query.meetingId = filters.meetingId;
      }

      const reminders = await Reminder.find(query)
        .populate('actionItemId')
        .populate('meetingId')
        .sort({ reminderDate: 1 });

      return reminders;
    } catch (error) {
      console.error('Error fetching reminders:', error);
      throw new Error(`Failed to fetch reminders: ${error.message}`);
    }
  }

  // Update reminder
  async updateReminder(reminderId, userId, updates) {
    try {
      const reminder = await Reminder.findOne({ _id: reminderId, userId });

      if (!reminder) {
        throw new Error('Reminder not found');
      }

      Object.assign(reminder, updates);
      await reminder.save();

      return reminder;
    } catch (error) {
      console.error('Error updating reminder:', error);
      throw new Error(`Failed to update reminder: ${error.message}`);
    }
  }

  // Delete reminder
  async deleteReminder(reminderId, userId) {
    try {
      const reminder = await Reminder.findOneAndDelete({ _id: reminderId, userId });

      if (!reminder) {
        throw new Error('Reminder not found');
      }

      return true;
    } catch (error) {
      console.error('Error deleting reminder:', error);
      throw new Error(`Failed to delete reminder: ${error.message}`);
    }
  }
}

export default new ReminderService();
