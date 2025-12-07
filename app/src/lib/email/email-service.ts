/**
 * Email Service using Resend
 *
 * Provides email sending functionality for the application.
 * Uses dynamic import to handle cases where resend package isn't installed.
 */

import {
  welcomeEmailTemplate,
  verificationEmailTemplate,
  passwordResetEmailTemplate,
} from './templates';

// Type for Resend client
interface ResendClient {
  emails: {
    send: (options: {
      from: string;
      to: string;
      subject: string;
      html: string;
    }) => Promise<{ data?: { id: string }; error?: { message: string } }>;
  };
}

// Lazy-loaded Resend client
let resendClient: ResendClient | null | undefined = undefined;

async function getResendClient(): Promise<ResendClient | null> {
  // Return cached client if already initialized
  if (resendClient !== undefined) {
    return resendClient;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[Email] RESEND_API_KEY not set. Emails will be logged instead.');
    resendClient = null;
    return null;
  }

  try {
    // Dynamic import to handle missing package gracefully
    const { Resend } = await import('resend');
    resendClient = new Resend(apiKey) as unknown as ResendClient;
    return resendClient;
  } catch {
    console.warn('[Email] Resend package not available. Emails will be logged instead.');
    resendClient = null;
    return null;
  }
}

// Get the sender email (use verified domain in production)
function getFromEmail(): string {
  return process.env.EMAIL_FROM || 'Studek <onboarding@resend.dev>';
}

// Get the app URL for links
function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send welcome email with verification link
 */
export async function sendWelcomeEmail(
  to: string,
  name: string | null,
  verificationToken: string
): Promise<SendEmailResult> {
  const verificationUrl = `${getAppUrl()}/verify-email?token=${verificationToken}`;
  const { subject, html } = welcomeEmailTemplate(name, verificationUrl);

  const resend = await getResendClient();
  if (!resend) {
    // Log email in development when Resend is not available
    console.log('[Email] Would send welcome email to:', to);
    console.log('[Email] Subject:', subject);
    console.log('[Email] Verification URL:', verificationUrl);
    return { success: true, messageId: 'dev-mode' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to,
      subject,
      html,
    });

    if (error) {
      console.error('[Email] Failed to send welcome email:', error);
      return { success: false, error: error.message };
    }

    console.log('[Email] Welcome email sent to:', to);
    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error('[Email] Error sending welcome email:', err);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Send verification email (for resend requests)
 */
export async function sendVerificationEmail(
  to: string,
  name: string | null,
  verificationToken: string
): Promise<SendEmailResult> {
  const verificationUrl = `${getAppUrl()}/verify-email?token=${verificationToken}`;
  const { subject, html } = verificationEmailTemplate(name, verificationUrl);

  const resend = await getResendClient();
  if (!resend) {
    // Log email in development when Resend is not available
    console.log('[Email] Would send verification email to:', to);
    console.log('[Email] Subject:', subject);
    console.log('[Email] Verification URL:', verificationUrl);
    return { success: true, messageId: 'dev-mode' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to,
      subject,
      html,
    });

    if (error) {
      console.error('[Email] Failed to send verification email:', error);
      return { success: false, error: error.message };
    }

    console.log('[Email] Verification email sent to:', to);
    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error('[Email] Error sending verification email:', err);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  to: string,
  name: string | null,
  resetToken: string
): Promise<SendEmailResult> {
  const resetUrl = `${getAppUrl()}/reset-password?token=${resetToken}`;
  const { subject, html } = passwordResetEmailTemplate(name, resetUrl);

  const resend = await getResendClient();
  if (!resend) {
    // Log email in development when Resend is not available
    console.log('[Email] Would send password reset email to:', to);
    console.log('[Email] Subject:', subject);
    console.log('[Email] Reset URL:', resetUrl);
    return { success: true, messageId: 'dev-mode' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to,
      subject,
      html,
    });

    if (error) {
      console.error('[Email] Failed to send password reset email:', error);
      return { success: false, error: error.message };
    }

    console.log('[Email] Password reset email sent to:', to);
    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error('[Email] Error sending password reset email:', err);
    return { success: false, error: 'Failed to send email' };
  }
}

export const emailService = {
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
};
