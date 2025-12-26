import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('Email service not configured');
      this.transporter = null;
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendMeetingInvite(participantEmail, meetingTitle, meetingLink, inviterName) {
    if (!this.transporter) {
      console.warn('Email service unavailable - skipping invite email');
      return;
    }

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: participantEmail,
        subject: `Meeting Invitation: ${meetingTitle}`,
        html: `
          <h2>You've been invited to a meeting</h2>
          <p><strong>${inviterName}</strong> has invited you to: <strong>${meetingTitle}</strong></p>
          <p><a href="${meetingLink}">Join Meeting</a></p>
        `,
      });
      console.log(`✅ Invitation sent to ${participantEmail}`);
    } catch (error) {
      console.error(`Failed to send invite to ${participantEmail}:`, error.message);
    }
  }
}

export default new EmailService();