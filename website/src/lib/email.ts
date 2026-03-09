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
