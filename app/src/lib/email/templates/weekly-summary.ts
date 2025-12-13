/**
 * Weekly Summary Email Template
 *
 * Sent weekly to show users their progress and encourage continued learning.
 */

import { baseTemplate, type EmailTemplate } from './base';

export interface WeeklySummaryData {
  name: string | null;
  weeklyXP: number;
  totalReviews: number;
  currentStreak: number;
  retentionRate: number;
  studyTimeMinutes: number;
  cardsLearned: number;
  dashboardUrl: string;
}

export function weeklySummaryEmailTemplate(data: WeeklySummaryData): EmailTemplate {
  const displayName = data.name || 'there';
  const {
    weeklyXP,
    totalReviews,
    currentStreak,
    retentionRate,
    studyTimeMinutes,
    cardsLearned,
    dashboardUrl,
  } = data;

  // Performance rating
  const isGreatWeek = weeklyXP >= 500 || totalReviews >= 100;
  const isGoodWeek = weeklyXP >= 200 || totalReviews >= 50;

  const emoji = isGreatWeek ? '🏆' : isGoodWeek ? '⭐' : '📊';
  const headline = isGreatWeek
    ? 'Amazing week!'
    : isGoodWeek
      ? 'Great progress!'
      : 'Your weekly recap';

  const content = `
    <!-- Summary Icon -->
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 64px; height: 64px; background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%); border-radius: 50%; line-height: 64px;">
        <span style="font-size: 32px;">${emoji}</span>
      </div>
    </div>

    <!-- Heading -->
    <h1 style="margin: 0 0 16px 0; color: #ffffff; font-size: 28px; font-weight: 700; text-align: center; line-height: 1.3;">
      ${headline}
    </h1>

    <!-- Subheading -->
    <p style="margin: 0 0 24px 0; color: #a1a1aa; font-size: 16px; line-height: 1.6; text-align: center;">
      Here's your learning summary for this week, ${displayName}!
    </p>

    <!-- Divider -->
    <div style="height: 1px; background: linear-gradient(90deg, transparent, #27272a, transparent); margin: 24px 0;"></div>

    <!-- Stats Grid -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
      <tr>
        <!-- XP Earned -->
        <td style="width: 50%; padding: 8px;">
          <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 12px; padding: 16px; text-align: center;">
            <p style="margin: 0 0 4px 0; color: #8b5cf6; font-size: 28px; font-weight: 700;">
              ${weeklyXP.toLocaleString()}
            </p>
            <p style="margin: 0; color: #71717a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
              XP Earned
            </p>
          </div>
        </td>
        <!-- Reviews -->
        <td style="width: 50%; padding: 8px;">
          <div style="background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 12px; padding: 16px; text-align: center;">
            <p style="margin: 0 0 4px 0; color: #22c55e; font-size: 28px; font-weight: 700;">
              ${totalReviews.toLocaleString()}
            </p>
            <p style="margin: 0; color: #71717a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
              Reviews
            </p>
          </div>
        </td>
      </tr>
      <tr>
        <!-- Streak -->
        <td style="width: 50%; padding: 8px;">
          <div style="background: linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(239, 68, 68, 0.1) 100%); border: 1px solid rgba(249, 115, 22, 0.2); border-radius: 12px; padding: 16px; text-align: center;">
            <p style="margin: 0 0 4px 0; color: #f59e0b; font-size: 28px; font-weight: 700;">
              ${currentStreak}
            </p>
            <p style="margin: 0; color: #71717a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
              Day Streak 🔥
            </p>
          </div>
        </td>
        <!-- Retention -->
        <td style="width: 50%; padding: 8px;">
          <div style="background: linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%); border: 1px solid rgba(6, 182, 212, 0.2); border-radius: 12px; padding: 16px; text-align: center;">
            <p style="margin: 0 0 4px 0; color: #06b6d4; font-size: 28px; font-weight: 700;">
              ${retentionRate}%
            </p>
            <p style="margin: 0; color: #71717a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
              Retention
            </p>
          </div>
        </td>
      </tr>
    </table>

    <!-- Additional Stats -->
    <div style="background: #18181b; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #27272a;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding: 8px 0;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="width: 24px; color: #71717a; font-size: 14px;">⏱️</td>
                <td style="color: #d4d4d8; font-size: 14px;">
                  <strong style="color: #ffffff;">${studyTimeMinutes} minutes</strong> of study time
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="width: 24px; color: #71717a; font-size: 14px;">📖</td>
                <td style="color: #d4d4d8; font-size: 14px;">
                  <strong style="color: #ffffff;">${cardsLearned} new cards</strong> learned
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>

    <!-- Motivation Message -->
    <p style="margin: 0 0 32px 0; color: #d4d4d8; font-size: 15px; line-height: 1.7; text-align: center;">
      ${
        isGreatWeek
          ? "You're crushing it! Keep up this incredible momentum and you'll master your flashcards in no time."
          : isGoodWeek
            ? "Nice work this week! Consistency is key to long-term retention. Let's make next week even better!"
            : "Every review counts! Set a small daily goal and watch your progress add up over time."
      }
    </p>

    <!-- CTA Button -->
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${dashboardUrl}" class="button" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px;">
        View Full Dashboard
      </a>
    </div>

    <!-- Divider -->
    <div style="height: 1px; background: linear-gradient(90deg, transparent, #27272a, transparent); margin: 24px 0;"></div>

    <!-- Footer Tip -->
    <p style="margin: 0; color: #52525b; font-size: 12px; line-height: 1.6; text-align: center;">
      This is your weekly progress summary. You can adjust your email preferences in
      <a href="${dashboardUrl.replace('/dashboard', '/settings')}" style="color: #8b5cf6;">settings</a>.
    </p>
  `;

  const subject = isGreatWeek
    ? `🏆 ${displayName}, you earned ${weeklyXP} XP this week!`
    : isGoodWeek
      ? `⭐ Your weekly learning summary is here!`
      : `📊 Your Studek weekly recap`;

  return {
    subject,
    html: baseTemplate(content),
  };
}
