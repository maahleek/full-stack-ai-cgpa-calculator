import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Resend's sandbox sender, works without any domain verification for testing.
// Swap to your own verified domain (e.g. "GradeLens <noreply@yourdomain.com>") once you have one.
const FROM = process.env.EMAIL_FROM || "GradeLens <onboarding@resend.dev>";

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  if (!resend) {
    // No API key configured — log instead of throwing, so local dev without
    // email set up doesn't hard-crash the request. The link still appears
    // in the server console, which is enough to test the flow manually.
    console.warn(
      `[email] RESEND_API_KEY is not set. Password reset link for ${to}:\n${resetUrl}`
    );
    return { skipped: true };
  }

  await resend.emails.send({
    from: FROM,
    to,
    subject: "Reset your GradeLens password",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1e293b;">Reset your password</h2>
        <p style="color: #475569;">
          We received a request to reset the password on your GradeLens account.
          This link expires in 30 minutes.
        </p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background: #4f46e5; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Reset password
          </a>
        </p>
        <p style="color: #94a3b8; font-size: 13px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });

  return { skipped: false };
}
