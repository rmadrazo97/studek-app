/**
 * Streak Warning Email Template
 *
 * Sent when a user's streak is at risk of being broken.
 * Creates urgency while being supportive.
 */

import { baseTemplate, type EmailTemplate } from './base';

export interface StreakWarningData {
  name: string | null;
  currentStreak: number;
  xpNeeded: number;
  hoursRemaining: number;
  studyUrl: string;
}

export function streakWarningEmailTemplate(data: StreakWarningData): EmailTemplate {
  const displayName = data.name || 'there';
  const { currentStreak, xpNeeded, hoursRemaining, studyUrl } = data;

  // Dynamic urgency based on time remaining
  const isUrgent = hoursRemaining <= 3;
  const urgencyColor = isUrgent ? '#ef4444' : '#f59e0b';
  const urgencyEmoji = isUrgent ? '⚠️' : '🔥';

  const content = `
    <!-- Warning Icon -->
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 64px; height: 64px; background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(249, 115, 22, 0.2) 100%); border-radius: 50%; line-height: 64px;">
        <span style="font-size: 32px;">${urgencyEmoji}</span>
      </div>
    </div>

    <!-- Heading -->
    <h1 style="margin: 0 0 16px 0; color: #ffffff; font-size: 28px; font-weight: 700; text-align: center; line-height: 1.3;">
      Your streak is at risk!
    </h1>

    <!-- Subheading -->
    <p style="margin: 0 0 24px 0; color: #a1a1aa; font-size: 16px; line-height: 1.6; text-align: center;">
      Hey ${displayName}, don't let your hard work go to waste!
    </p>

    <!-- Divider -->
    <div style="height: 1px; background: linear-gradient(90deg, transparent, #27272a, transparent); margin: 24px 0;"></div>

    <!-- Streak Alert Box -->
    <div style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(249, 115, 22, 0.1) 100%); border: 1px solid ${urgencyColor}40; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <div style="text-align: center;">
        <p style="margin: 0 0 8px 0; color: ${urgencyColor}; font-size: 48px; font-weight: 700; line-height: 1;">
          ${currentStreak}
        </p>
        <p style="margin: 0 0 16px 0; color: #a1a1aa; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
          Day Streak At Risk
        </p>
        <div style="height: 1px; background: #27272a; margin: 16px 0;"></div>
        <p style="margin: 0; color: #d4d4d8; font-size: 15px; line-height: 1.6;">
          Earn <strong style="color: ${urgencyColor};">${xpNeeded} XP</strong> in the next
          <strong style="color: ${urgencyColor};">${hoursRemaining} hours</strong> to save it!
        </p>
      </div>
    </div>

    <!-- Message -->
    <p style="margin: 0 0 8px 0; color: #d4d4d8; font-size: 15px; line-height: 1.7; text-align: center;">
      ${
        currentStreak >= 30
          ? `You've worked so hard to build this ${currentStreak}-day streak! Just a quick study session will keep it alive.`
          : currentStreak >= 7
            ? `A whole week of consistent learning! Don't break the chain now.`
            : `Every day counts towards building a strong learning habit. Keep going!`
      }
    </p>

    <p style="margin: 0 0 32px 0; color: #71717a; font-size: 13px; line-height: 1.6; text-align: center;">
      Complete just ${Math.ceil(xpNeeded / 10)} review${Math.ceil(xpNeeded / 10) > 1 ? 's' : ''} to earn ${xpNeeded} XP.
    </p>

    <!-- CTA Button -->
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${studyUrl}" class="button" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px;">
        Save My Streak!
      </a>
    </div>

    <!-- Divider -->
    <div style="height: 1px; background: linear-gradient(90deg, transparent, #27272a, transparent); margin: 24px 0;"></div>

    <!-- Tip -->
    <div style="background: #18181b; border-radius: 8px; padding: 16px; border: 1px solid #27272a;">
      <p style="margin: 0; color: #71717a; font-size: 13px; line-height: 1.6;">
        <strong style="color: #a1a1aa;">💡 Pro tip:</strong>
        Set a daily reminder at a time that works for you in your
        <a href="${studyUrl.replace('/study', '/settings')}" style="color: #8b5cf6;">notification settings</a>.
      </p>
    </div>
  `;

  const subject = isUrgent
    ? `⚠️ ${displayName}, your ${currentStreak}-day streak ends in ${hoursRemaining}h!`
    : `🔥 ${displayName}, save your ${currentStreak}-day streak!`;

  return {
    subject,
    html: baseTemplate(content),
  };
}
