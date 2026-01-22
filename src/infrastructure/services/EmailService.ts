import nodemailer from 'nodemailer';
import { IEmailService } from '../../domain/services/IEmailService';
import { ENV_CONFIG } from '../config/env.config';

export class EmailService implements IEmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: ENV_CONFIG.EMAIL_HOST,
      port: ENV_CONFIG.EMAIL_PORT,
      secure: false,
      auth: {
        user: ENV_CONFIG.EMAIL_USER,
        pass: ENV_CONFIG.EMAIL_PASS,
      },
    });
  }

  async sendWelcomeEmailWithoutPassword(email: string, name: string): Promise<void> {
    const mailOptions = {
      from: `"Thrive in Japan" <${ENV_CONFIG.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to Thrive in Japan!',
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #5C633A;">Welcome to Thrive in Japan, ${name}! 🌸</h1>
        <p>Your learning journey begins now!</p>
        <p>You can log in to your account using the email and password you provided during registration.</p>
        <a href="${ENV_CONFIG.FRONTEND_URL}/login" style="display: inline-block; background-color: #5C633A; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px;">Login Now</a>
        <p style="color: #666; margin-top: 20px;">If you have any questions, feel free to reach out to our support team.</p>
      </div>
    `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendWelcomeEmail(email: string, temporaryPassword: string): Promise<void> {
    const mailOptions = {
      from: `"Thrive in Japan" <${ENV_CONFIG.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to Thrive in Japan - Your Account Details',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #5C633A;">Welcome to Thrive in Japan! 🌸</h1>
          <p>Your learning journey begins now!</p>
          <p>Here are your login credentials:</p>
          <div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px;">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> <code style="background-color: #fff; padding: 5px;">${temporaryPassword}</code></p>
          </div>
          <p style="color: #666; margin-top: 20px;">Please change your password after your first login.</p>
          <a href="${ENV_CONFIG.FRONTEND_URL}/login" style="display: inline-block; background-color: #5C633A; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px;">Login Now</a>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${ENV_CONFIG.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"Thrive in Japan" <${ENV_CONFIG.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #5C633A;">Password Reset Request</h1>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #5C633A; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px;">Reset Password</a>
          <p style="color: #666; margin-top: 20px;">This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendBookingConfirmation(email: string, sessionDetails: any): Promise<void> {
    const mailOptions = {
      from: `"Thrive in Japan" <${ENV_CONFIG.EMAIL_USER}>`,
      to: email,
      subject: 'Booking Confirmation - ' + sessionDetails.title,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #5C633A;">Booking Confirmed! 🎉</h1>
          <p>Your session has been booked successfully.</p>
          <div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px;">
            <h3>${sessionDetails.title}</h3>
            <p><strong>Date:</strong> ${new Date(sessionDetails.scheduledAt).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${new Date(sessionDetails.scheduledAt).toLocaleTimeString()}</p>
            <p><strong>Duration:</strong> ${sessionDetails.duration} minutes</p>
            ${sessionDetails.meetingUrl ? `<p><strong>Meeting Link:</strong> <a href="${sessionDetails.meetingUrl}">${sessionDetails.meetingUrl}</a></p>` : ''}
          </div>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendSessionReminder(email: string, sessionDetails: any): Promise<void> {
    const mailOptions = {
      from: `"Thrive in Japan" <${ENV_CONFIG.EMAIL_USER}>`,
      to: email,
      subject: 'Reminder: Session Starting Soon - ' + sessionDetails.title,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #5C633A;">Session Reminder ⏰</h1>
          <p>Your session is starting in 1 hour!</p>
          <div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px;">
            <h3>${sessionDetails.title}</h3>
            <p><strong>Time:</strong> ${new Date(sessionDetails.scheduledAt).toLocaleTimeString()}</p>
            ${sessionDetails.meetingUrl ? `<a href="${sessionDetails.meetingUrl}" style="display: inline-block; background-color: #5C633A; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Join Session</a>` : ''}
          </div>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendVerificationCode(email: string, code: string): Promise<void> {

    const mailOptions = {
      from: `"Thrive in Japan" <${ENV_CONFIG.EMAIL_USER}>`,
      to: email,
      subject: 'Verify your email - Thrive in Japan',
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #5C633A 0%, #D4BC8C 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Welcome to Thrive in Japan! 🌸</h1>
        </div>
        <div style="padding: 40px; background-color: #f9f9f9;">
          <h2 style="color: #2D3436; margin-bottom: 20px;">Verify your email</h2>
          <p style="color: #636E72; font-size: 16px; line-height: 1.5;">
            Thank you for joining us! Please use the verification code below to continue your registration:
          </p>
          <div style="background-color: white; border-radius: 10px; padding: 30px; margin: 30px 0; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #5C633A; font-size: 36px; letter-spacing: 10px; margin: 0;">${code}</h1>
          </div>
          <p style="color: #636E72; font-size: 14px; text-align: center;">
            This code will expire in 10 minutes.
          </p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
          <p style="color: #636E72; font-size: 12px; text-align: center;">
            If you didn't request this code, please ignore this email.
          </p>
        </div>
      </div>
    `,
    };

    await this.transporter.sendMail(mailOptions);
  }
}