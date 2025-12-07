/**
 * Welcome Email Template
 *
 * Sent to new users upon registration with email verification link.
 */

import { baseTemplate, type EmailTemplate } from './base';

export function welcomeEmailTemplate(
  name: string | null,
  verificationUrl: string
): EmailTemplate {
  const displayName = name || 'there';

  const content = `
    <!-- Welcome Icon -->
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 64px; height: 64px; background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%); border-radius: 50%; line-height: 64px;">
        <span style="font-size: 32px;">🎉</span>
      </div>
    </div>

    <!-- Heading -->
    <h1 style="margin: 0 0 16px 0; color: #ffffff; font-size: 28px; font-weight: 700; text-align: center; line-height: 1.3;">
      Welcome to Studek!
    </h1>

    <!-- Subheading -->
    <p style="margin: 0 0 24px 0; color: #a1a1aa; font-size: 16px; line-height: 1.6; text-align: center;">
      Hey ${displayName}, we're excited to have you on board!
    </p>

    <!-- Divider -->
    <div style="height: 1px; background: linear-gradient(90deg, transparent, #27272a, transparent); margin: 24px 0;"></div>

    <!-- Description -->
    <p style="margin: 0 0 8px 0; color: #d4d4d8; font-size: 15px; line-height: 1.7;">
      You're just one step away from unlocking the power of smart flashcards with spaced repetition.
    </p>
    <p style="margin: 0 0 32px 0; color: #d4d4d8; font-size: 15px; line-height: 1.7;">
      Please verify your email address to activate your account and start your learning journey.
    </p>

    <!-- CTA Button -->
    <div style="text-align: center; margin-bottom: 32px;">
      <a href="${verificationUrl}" class="button" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px;">
        Verify Email Address
      </a>
    </div>

    <!-- Alternative Link -->
    <p style="margin: 0 0 8px 0; color: #71717a; font-size: 13px; line-height: 1.6; text-align: center;">
      If the button doesn't work, copy and paste this link into your browser:
    </p>
    <p style="margin: 0 0 24px 0; color: #8b5cf6; font-size: 12px; line-height: 1.6; text-align: center; word-break: break-all;">
      <a href="${verificationUrl}" style="color: #8b5cf6;">${verificationUrl}</a>
    </p>

    <!-- Divider -->
    <div style="height: 1px; background: linear-gradient(90deg, transparent, #27272a, transparent); margin: 24px 0;"></div>

    <!-- Features -->
    <p style="margin: 0 0 16px 0; color: #ffffff; font-size: 14px; font-weight: 600;">
      What you can do with Studek:
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td style="padding: 8px 0;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="width: 24px; color: #6366f1; font-size: 14px;">✓</td>
              <td style="color: #a1a1aa; font-size: 14px;">Create flashcards from any content</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 8px 0;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="width: 24px; color: #6366f1; font-size: 14px;">✓</td>
              <td style="color: #a1a1aa; font-size: 14px;">Learn efficiently with FSRS algorithm</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 8px 0;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="width: 24px; color: #6366f1; font-size: 14px;">✓</td>
              <td style="color: #a1a1aa; font-size: 14px;">Track your progress with analytics</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 8px 0;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="width: 24px; color: #6366f1; font-size: 14px;">✓</td>
              <td style="color: #a1a1aa; font-size: 14px;">Share decks with friends and classmates</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Expiry Notice -->
    <p style="margin: 24px 0 0 0; color: #52525b; font-size: 12px; line-height: 1.6; text-align: center;">
      This verification link will expire in 24 hours.
    </p>
  `;

  return {
    subject: 'Welcome to Studek! Please verify your email',
    html: baseTemplate(content),
  };
}
