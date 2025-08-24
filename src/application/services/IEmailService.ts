export interface IEmailService {
  sendWelcomeEmail(email: string, temporaryPassword: string): Promise<void>;
  sendWelcomeEmailWithoutPassword(email: string, name: string): Promise<void>; // Add this line
  sendPasswordResetEmail(email: string, resetToken: string): Promise<void>;
  sendBookingConfirmation(email: string, sessionDetails: any): Promise<void>;
  sendSessionReminder(email: string, sessionDetails: any): Promise<void>;
  sendVerificationCode(email: string, code: string): Promise<void>; // Also add this if not already present
}