/**
 * GetMailer Email Onboarding Integration
 *
 * This service enrolls new users into the GetMailer onboarding sequence.
 * Emails are managed centrally in GetMailer (app.getmailer.co).
 */

interface EnrollOptions {
  email: string
  firstName?: string
  lastName?: string
  metadata?: Record<string, string>
}

const GETMAILER_ENROLL_URL =
  process.env.GETMAILER_URL || "https://app.getmailer.co"
const GETMAILER_ENROLL_KEY = process.env.GETMAILER_ENROLL_KEY || ""

/**
 * Enroll a user in the GetMailer onboarding sequence (fire-and-forget).
 *
 * This is intentionally non-blocking. Errors are caught and logged
 * so that signup is never delayed or broken by email enrollment.
 */
export function enrollInOnboardingAsync(options: EnrollOptions): void {
  // Skip if no enroll key configured
  if (!GETMAILER_ENROLL_KEY) {
    return
  }

  const body = {
    project: 'roaster',
    email: options.email,
    firstName: options.firstName,
    lastName: options.lastName,
    source: 'signup',
    metadata: options.metadata,
  }

  // Fire-and-forget HTTP call — intentionally not awaited
  fetch(`${GETMAILER_ENROLL_URL}/api/public/enroll`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-enroll-key": GETMAILER_ENROLL_KEY,
    },
    body: JSON.stringify(body),
  }).catch((err) => {
    // Silently catch — email enrollment must never break signup
    console.error("[email-onboarding] Failed to enroll user:", err?.message)
  })
}

/**
 * Fire-and-forget exit from onboarding sequence.
 * Call when user completes onboarding or subscribes.
 */
export function exitOnboardingSequenceAsync(email: string, reason: string = 'completed'): void {
  // Skip if no enroll key configured
  if (!GETMAILER_ENROLL_KEY) {
    return
  }

  fetch(`${GETMAILER_ENROLL_URL}/api/public/exit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-enroll-key": GETMAILER_ENROLL_KEY,
    },
    body: JSON.stringify({
      project: 'roaster',
      email,
      reason,
    }),
  }).catch((err) => {
    console.error("[email-onboarding] Failed to exit sequence:", err?.message)
  })
}
