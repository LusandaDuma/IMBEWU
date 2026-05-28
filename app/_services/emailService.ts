/**
 * @fileoverview Email service stub.
 * Resend integration is handled server-side via Supabase Edge Functions.
 * This module exists to satisfy imports; email sending should be done
 * through the Supabase `copilot` Edge Function or Supabase Auth triggers.
 */

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export interface EmailResult {
  ok: boolean;
  error?: string;
}

/**
 * Placeholder email sender.
 * Wire up a Supabase Edge Function or another server-side transport here.
 */
export async function sendEmail(_params: SendEmailParams): Promise<EmailResult> {
  console.warn('[emailService] sendEmail called — no transport configured.');
  return { ok: false, error: 'Email transport not configured.' };
}
