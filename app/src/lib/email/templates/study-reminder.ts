/**
 * Study Reminder Email Template
 *
 * Sent daily to remind users to study their flashcards.
 * Duolingo-style motivational reminder.
 */

import { baseTemplate, type EmailTemplate } from './base';

export interface StudyReminderData {
  name: string | null;
  cardsDue: number;
  currentStreak: number;
  studyUrl: string;
}

export function studyReminderEmailTemplate(data: StudyReminderData): EmailTemplate {
  const displayName = data.name || 'there';
  const { cardsDue, currentStreak, studyUrl } = data;

  // Dynamic greeting based on time of day
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Dynamic content based on streak
  const streakEmoji = currentStreak >= 30 ? '🏆' : currentStreak >= 7 ? '🔥' : '✨';
  const streakMessage =
    currentStreak > 0
      ? `You're on a ${currentStreak}-day streak! ${streakEmoji}`
      : "Start building your streak today!";

  const content = `
    <!-- Greeting Icon -->
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 64px; height: 64px; background: linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%); border-radius: 50%; line-height: 64px;">
        <span style="font-size: 32px;">📚</span>
      </div>
    </div>

    <!-- Heading -->
    <h1 style="margin: 0 0 16px 0; color: #ffffff; font-size: 28px; font-weight: 700; text-align: center; line-height: 1.3;">
      ${greeting}, ${displayName}!
    </h1>

    <!-- Subheading -->
    <p style="margin: 0 0 24px 0; color: #a1a1aa; font-size: 16px; line-height: 1.6; text-align: center;">
      ${streakMessage}
    </p>

    <!-- Divider -->
    <div style="height: 1px; background: linear-gradient(90deg, transparent, #27272a, transparent); margin: 24px 0;"></div>

    <!-- Stats Box -->
    <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="text-align: center; padding: 0 16px;">
            <p style="margin: 0 0 4px 0; color: #8b5cf6; font-size: 32px; font-weight: 700;">
              ${cardsDue}
            </p>
            <p style="margin: 0; color: #a1a1aa; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
              Cards Due
            </p>
          </td>
          <td style="width: 1px; background: #27272a;"></td>
          <td style="text-align: center; padding: 0 16px;">
            <p style="margin: 0 0 4px 0; color: #f59e0b; font-size: 32px; font-weight: 700;">
              ${currentStreak}
            </p>
            <p style="margin: 0; color: #a1a1aa; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
              Day Streak
            </p>
          </td>
        </tr>
      </table>
    </div>

    <!-- Message -->
    ${
      cardsDue > 0
        ? `
    <p style="margin: 0 0 24px 0; color: #d4d4d8; font-size: 15px; line-height: 1.7; text-align: center;">
      You have <strong style="color: #8b5cf6;">${cardsDue} cards</strong> waiting to be reviewed.
      Taking just 5 minutes now will help keep your knowledge fresh!
    </p>
    `
        : `
    <p style="margin: 0 0 24px 0; color: #d4d4d8; font-size: 15px; line-height: 1.7; text-align: center;">
      Great job staying on top of your reviews!
      Check in to keep your streak going and reinforce what you've learned.
    </p>
    `
    }

    <!-- CTA Button -->
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${studyUrl}" class="button" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #22c55e 0%, #10b981 100%); color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px;">
        Start Studying Now
      </a>
    </div>

    <!-- Divider -->
    <div style="height: 1px; background: linear-gradient(90deg, transparent, #27272a, transparent); margin: 24px 0;"></div>

    <!-- Motivation -->
    <p style="margin: 0; color: #71717a; font-size: 13px; line-height: 1.6; text-align: center; font-style: italic;">
      "The secret of getting ahead is getting started." - Mark Twain
    </p>
  `;

  const subject =
    cardsDue > 0
      ? `${cardsDue} cards are waiting for you, ${displayName}!`
      : `Keep your ${currentStreak}-day streak going!`;

  return {
    subject,
    html: baseTemplate(content),
  };
}
