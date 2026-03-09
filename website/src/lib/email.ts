/**
 * Email Service using GetMailer
 * https://getmailer.co
 */

import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";

const GETMAILER_API_URL = "https://getmailer.co/api/emails";
const FROM_EMAIL = "hello@getia.no";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const apiKey = process.env.GETMAILER_API_KEY;

  if (!apiKey) {
    console.warn("[EMAIL] GETMAILER_API_KEY not set, logging email instead");
    console.log("[EMAIL] Would send:", {
      from: FROM_EMAIL,
      ...options,
    });
    return true;
  }

  try {
    const response = await fetch(GETMAILER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[EMAIL] Failed to send:", error);
      return false;
    }

    console.log("[EMAIL] Sent successfully to:", options.to);
    return true;
  } catch (error) {
    console.error("[EMAIL] Error sending email:", error);
    return false;
  }
}

/**
 * Send magic link email for authentication
 */
export async function sendMagicLinkEmail(
  email: string,
  token: string
): Promise<boolean> {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  const t = dict.emails.magicLink;

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const magicLinkUrl = `${baseUrl}/login/magic?token=${token}`;

  // Log for development
  console.log(`[MAGIC_LINK] ${email}: ${magicLinkUrl}`);

  return sendEmail({
    to: email,
    subject: t.subject,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #faf9f6; padding: 40px 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <h1 style="font-size: 24px; margin: 0 0 16px; color: #1a1a1a;">${t.heading}</h1>
            <p style="color: #666; margin: 0 0 24px; line-height: 1.6;">
              ${t.body}
            </p>
            <a href="${magicLinkUrl}" style="display: inline-block; background: #1a1a1a; color: white; padding: 14px 28px; border-radius: 100px; text-decoration: none; font-weight: 600;">
              ${t.buttonText}
            </a>
            <p style="color: #999; font-size: 14px; margin: 24px 0 0; line-height: 1.6;">
              ${t.ignoreNotice}
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              ${t.footer}
            </p>
          </div>
        </body>
      </html>
    `,
    text: t.textBody.replace('{url}', magicLinkUrl),
  });
}

/**
 * Send roster published notification email
 */
export async function sendRosterPublishedEmail(
  email: string,
  rosterName: string,
  startDate: string,
  endDate: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: `New Schedule Published - ${rosterName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #faf9f6; padding: 40px 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <h1 style="font-size: 24px; margin: 0 0 16px; color: #1a1a1a;">New Schedule Published</h1>
            <p style="color: #666; margin: 0 0 16px; line-height: 1.6;">
              A new schedule has been published and your shifts are now available to view.
            </p>
            <div style="background: #f8f7f5; border-radius: 12px; padding: 20px; margin: 0 0 24px;">
              <p style="color: #1a1a1a; font-weight: 600; margin: 0 0 8px;">${rosterName}</p>
              <p style="color: #666; margin: 0; font-size: 14px;">${startDate} — ${endDate}</p>
            </div>
            <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/dashboard/rosters" style="display: inline-block; background: #2d5a4a; color: white; padding: 14px 28px; border-radius: 100px; text-decoration: none; font-weight: 600;">
              View Your Shifts
            </a>
            <p style="color: #999; font-size: 14px; margin: 24px 0 0; line-height: 1.6;">
              Log in to your dashboard to see your assigned shifts and any important details.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              Roaster - Scheduling software built for labor law compliance
            </p>
          </div>
        </body>
      </html>
    `,
    text: `New Schedule Published\n\n${rosterName}\n${startDate} — ${endDate}\n\nA new schedule has been published and your shifts are now available to view.\n\nLog in to your dashboard to see your assigned shifts.`,
  });
}

/**
 * Send shift changed notification email
 */
export async function sendShiftChangedEmail(
  email: string,
  shiftDate: string,
  oldTime: string,
  newTime: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: `Shift Update - ${shiftDate}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #faf9f6; padding: 40px 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <h1 style="font-size: 24px; margin: 0 0 16px; color: #1a1a1a;">Shift Updated</h1>
            <p style="color: #666; margin: 0 0 16px; line-height: 1.6;">
              Your shift on <strong>${shiftDate}</strong> has been modified. Please review the changes below.
            </p>
            <div style="background: #f8f7f5; border-radius: 12px; padding: 20px; margin: 0 0 24px;">
              <p style="color: #999; font-size: 13px; margin: 0 0 4px;">Previous</p>
              <p style="color: #1a1a1a; margin: 0 0 12px; text-decoration: line-through;">${oldTime}</p>
              <p style="color: #999; font-size: 13px; margin: 0 0 4px;">Updated</p>
              <p style="color: #2d5a4a; font-weight: 600; margin: 0;">${newTime}</p>
            </div>
            <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/dashboard/rosters" style="display: inline-block; background: #2d5a4a; color: white; padding: 14px 28px; border-radius: 100px; text-decoration: none; font-weight: 600;">
              View Schedule
            </a>
            <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              Roaster - Scheduling software built for labor law compliance
            </p>
          </div>
        </body>
      </html>
    `,
    text: `Shift Updated\n\nYour shift on ${shiftDate} has been modified.\n\nPrevious: ${oldTime}\nUpdated: ${newTime}\n\nLog in to your dashboard to view the full schedule.`,
  });
}

/**
 * Send time off approved notification email
 */
export async function sendTimeOffApprovedEmail(
  email: string,
  dates: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: "Time Off Approved",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #faf9f6; padding: 40px 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <h1 style="font-size: 24px; margin: 0 0 16px; color: #1a1a1a;">Time Off Approved</h1>
            <p style="color: #666; margin: 0 0 16px; line-height: 1.6;">
              Your time off request has been approved.
            </p>
            <div style="background: #f8f7f5; border-radius: 12px; padding: 20px; margin: 0 0 24px;">
              <p style="color: #999; font-size: 13px; margin: 0 0 4px;">Approved dates</p>
              <p style="color: #2d5a4a; font-weight: 600; margin: 0;">${dates}</p>
            </div>
            <p style="color: #666; font-size: 14px; margin: 0 0 24px; line-height: 1.6;">
              Your schedule has been updated accordingly. No further action is needed.
            </p>
            <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/m/time-off" style="display: inline-block; background: #2d5a4a; color: white; padding: 14px 28px; border-radius: 100px; text-decoration: none; font-weight: 600;">
              View Time Off
            </a>
            <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              Roaster - Scheduling software built for labor law compliance
            </p>
          </div>
        </body>
      </html>
    `,
    text: `Time Off Approved\n\nYour time off request has been approved.\n\nApproved dates: ${dates}\n\nYour schedule has been updated accordingly.`,
  });
}

/**
 * Send time off rejected notification email
 */
export async function sendTimeOffRejectedEmail(
  email: string,
  dates: string,
  reason?: string
): Promise<boolean> {
  const reasonBlock = reason
    ? `<p style="color: #666; margin: 12px 0 0; font-size: 14px;"><strong>Reason:</strong> ${reason}</p>`
    : "";
  const reasonText = reason ? `\nReason: ${reason}` : "";

  return sendEmail({
    to: email,
    subject: "Time Off Not Approved",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #faf9f6; padding: 40px 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <h1 style="font-size: 24px; margin: 0 0 16px; color: #1a1a1a;">Time Off Not Approved</h1>
            <p style="color: #666; margin: 0 0 16px; line-height: 1.6;">
              Unfortunately, your time off request was not approved.
            </p>
            <div style="background: #f8f7f5; border-radius: 12px; padding: 20px; margin: 0 0 24px;">
              <p style="color: #999; font-size: 13px; margin: 0 0 4px;">Requested dates</p>
              <p style="color: #1a1a1a; font-weight: 600; margin: 0;">${dates}</p>
              ${reasonBlock}
            </div>
            <p style="color: #666; font-size: 14px; margin: 0 0 24px; line-height: 1.6;">
              Please contact your manager if you have questions or would like to discuss alternatives.
            </p>
            <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/m/time-off" style="display: inline-block; background: #1a1a1a; color: white; padding: 14px 28px; border-radius: 100px; text-decoration: none; font-weight: 600;">
              View Time Off
            </a>
            <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              Roaster - Scheduling software built for labor law compliance
            </p>
          </div>
        </body>
      </html>
    `,
    text: `Time Off Not Approved\n\nYour time off request for ${dates} was not approved.${reasonText}\n\nPlease contact your manager if you have questions.`,
  });
}

/**
 * Send compliance alert email to managers
 */
export async function sendComplianceAlertEmail(
  email: string,
  violationType: string,
  details: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: "Compliance Alert - Action Required",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #faf9f6; padding: 40px 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <h1 style="font-size: 24px; margin: 0 0 16px; color: #c53030;">Compliance Alert</h1>
            <p style="color: #666; margin: 0 0 16px; line-height: 1.6;">
              A compliance violation has been detected that requires your attention.
            </p>
            <div style="background: #fff5f5; border-radius: 12px; padding: 20px; margin: 0 0 24px; border-left: 4px solid #c53030;">
              <p style="color: #c53030; font-weight: 600; margin: 0 0 8px;">${violationType}</p>
              <p style="color: #666; margin: 0; font-size: 14px; line-height: 1.6;">${details}</p>
            </div>
            <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/dashboard/reports/compliance" style="display: inline-block; background: #c53030; color: white; padding: 14px 28px; border-radius: 100px; text-decoration: none; font-weight: 600;">
              Review Compliance Report
            </a>
            <p style="color: #999; font-size: 14px; margin: 24px 0 0; line-height: 1.6;">
              Please resolve this issue as soon as possible to maintain compliance with labor regulations.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              Roaster - Scheduling software built for labor law compliance
            </p>
          </div>
        </body>
      </html>
    `,
    text: `Compliance Alert - Action Required\n\n${violationType}\n\n${details}\n\nPlease log in to your dashboard to review and resolve this compliance issue.`,
  });
}

/**
 * Send welcome email after account creation
 */
export async function sendWelcomeEmail(
  email: string,
  magicLinkToken: string
): Promise<boolean> {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  const t = dict.emails.welcome;

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const magicLinkUrl = `${baseUrl}/login/magic?token=${magicLinkToken}`;

  // Log for development
  console.log(`[WELCOME] ${email}: ${magicLinkUrl}`);

  return sendEmail({
    to: email,
    subject: t.subject,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #faf9f6; padding: 40px 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <h1 style="font-size: 24px; margin: 0 0 16px; color: #1a1a1a;">${t.heading}</h1>
            <p style="color: #666; margin: 0 0 16px; line-height: 1.6;">
              ${t.trialReady}
            </p>
            <p style="color: #666; margin: 0 0 24px; line-height: 1.6;">
              ${t.dashboardCta}
            </p>
            <a href="${magicLinkUrl}" style="display: inline-block; background: #2d5a4a; color: white; padding: 14px 28px; border-radius: 100px; text-decoration: none; font-weight: 600;">
              ${t.buttonText}
            </a>
            <div style="background: #f8f7f5; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <p style="color: #1a1a1a; font-weight: 600; margin: 0 0 12px;">${t.whatsIncluded}</p>
              <ul style="color: #666; margin: 0; padding-left: 20px; line-height: 1.8;">
                <li>${t.featureCompliance}</li>
                <li>${t.featurePublishing}</li>
                <li>${t.featureRest}</li>
                <li>${t.featureReports}</li>
              </ul>
            </div>
            <p style="color: #999; font-size: 14px; margin: 0; line-height: 1.6;">
              ${t.contactUs}
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              ${t.footer}
            </p>
          </div>
        </body>
      </html>
    `,
    text: t.textBody.replace('{url}', magicLinkUrl),
  });
}
