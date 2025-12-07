/**
 * Password Reset Email Template
 *
 * Sent when user requests a password reset.
 */

import { baseTemplate, type EmailTemplate } from './base';

export function passwordResetEmailTemplate(
  name: string | null,
  resetUrl: string
): EmailTemplate {
  const displayName = name || 'there';

  const content = `
    <!-- Reset Icon -->
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 64px; height: 64px; background: linear-gradient(135deg, rgba(234, 179, 8, 0.2) 0%, rgba(249, 115, 22, 0.2) 100%); border-radius: 50%; line-height: 64px;">
        <span style="font-size: 32px;">🔐</span>
      </div>
    </div>

    <!-- Heading -->
    <h1 style="margin: 0 0 16px 0; color: #ffffff; font-size: 28px; font-weight: 700; text-align: center; line-height: 1.3;">
      Reset Your Password
    </h1>

    <!-- Subheading -->
    <p style="margin: 0 0 24px 0; color: #a1a1aa; font-size: 16px; line-height: 1.6; text-align: center;">
      Hey ${displayName}, we received a request to reset your password.
    </p>

    <!-- Divider -->
    <div style="height: 1px; background: linear-gradient(90deg, transparent, #27272a, transparent); margin: 24px 0;"></div>

    <!-- Description -->
    <p style="margin: 0 0 32px 0; color: #d4d4d8; font-size: 15px; line-height: 1.7;">
      Click the button below to create a new password. For security reasons, this link will expire in 1 hour.
    </p>

    <!-- CTA Button -->
    <div style="text-align: center; margin-bottom: 32px;">
      <a href="${resetUrl}" class="button" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #eab308 0%, #f97316 100%); color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px;">
        Reset Password
      </a>
    </div>

    <!-- Alternative Link -->
    <p style="margin: 0 0 8px 0; color: #71717a; font-size: 13px; line-height: 1.6; text-align: center;">
      If the button doesn't work, copy and paste this link into your browser:
    </p>
    <p style="margin: 0 0 24px 0; color: #eab308; font-size: 12px; line-height: 1.6; text-align: center; word-break: break-all;">
      <a href="${resetUrl}" style="color: #eab308;">${resetUrl}</a>
    </p>

    <!-- Security Warning -->
    <div style="background-color: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.3); border-radius: 8px; padding: 16px; margin-top: 24px;">
      <p style="margin: 0; color: #fbbf24; font-size: 13px; line-height: 1.6;">
        <strong>Security Notice</strong><br>
        <span style="color: #a1a1aa;">
          If you didn't request this password reset, please ignore this email. Your password will remain unchanged and your account is safe.
        </span>
      </p>
    </div>

    <!-- Tips -->
    <div style="margin-top: 24px;">
      <p style="margin: 0 0 12px 0; color: #ffffff; font-size: 14px; font-weight: 600;">
        Password tips:
      </p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding: 4px 0;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="width: 24px; color: #71717a; font-size: 14px;">•</td>
                <td style="color: #a1a1aa; font-size: 13px;">Use at least 8 characters</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 4px 0;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="width: 24px; color: #71717a; font-size: 14px;">•</td>
                <td style="color: #a1a1aa; font-size: 13px;">Mix letters, numbers, and symbols</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 4px 0;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="width: 24px; color: #71717a; font-size: 14px;">•</td>
                <td style="color: #a1a1aa; font-size: 13px;">Don't reuse passwords from other sites</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>

    <!-- Expiry Notice -->
    <p style="margin: 24px 0 0 0; color: #52525b; font-size: 12px; line-height: 1.6; text-align: center;">
      This password reset link will expire in 1 hour.
    </p>
  `;

  return {
    subject: 'Reset your Studek password',
    html: baseTemplate(content),
  };
}
