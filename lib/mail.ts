import nodemailer from "nodemailer";

function getSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim().replace(/\s+/g, "");
  const port = Number(process.env.SMTP_PORT?.trim()) || 465;
  const user = process.env.SMTP_USER?.trim().replace(/\s+/g, "");
  const pass = process.env.SMTP_PASSWORD?.replace(/^["'\s]+|["'\s]+$/g, "").replace(/\s+/g, "").trim();
  const from = process.env.SMTP_FROM?.trim() || "Booking Service <noreply@example.com>";
  return { host, port, user, pass, from };
}

let transporter: nodemailer.Transporter | null = null;
let lastConfigKey = "";

function getTransporter(): nodemailer.Transporter | null {
  const { host, port, user, pass } = getSmtpConfig();
  if (!host || !user || !pass) return null;
  const configKey = `${host}:${user}:${pass.length}`;
  if (!transporter || lastConfigKey !== configKey) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: true,
      auth: { user, pass },
    });
    lastConfigKey = configKey;
  }
  return transporter;
}

export function isMailConfigured(): boolean {
  const { host, user, pass } = getSmtpConfig();
  return Boolean(host && user && pass);
}

export async function sendVerificationCode(email: string, code: string): Promise<{ ok: boolean; error?: string }> {
  const transport = getTransporter();
  if (!transport) {
    return { ok: false, error: "SMTP not configured (SMTP_HOST, SMTP_USER, SMTP_PASSWORD)" };
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification code</title>
</head>
<body style="margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 24px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 420px; background: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden;">
          <tr>
            <td style="padding: 32px 28px;">
              <h1 style="margin: 0 0 8px; font-size: 20px; font-weight: 600; color: #0f172a;">Verification code</h1>
              <p style="margin: 0 0 24px; font-size: 15px; color: #64748b; line-height: 1.5;">Use this code to complete registration:</p>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; text-align: center;">
                <span style="font-size: 28px; font-weight: 700; letter-spacing: 0.2em; color: #334155;">${code}</span>
              </div>
              <p style="margin: 24px 0 0; font-size: 13px; color: #94a3b8;">This code is valid for 15 minutes. If you did not request registration, ignore this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

  const { from } = getSmtpConfig();
  try {
    await transport.sendMail({
      from: from || "Booking Service <noreply@example.com>",
      to: email,
      subject: "Verification code for registration",
      html,
    });
    return { ok: true };
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    console.error("Mail send error:", err);
    if (/535|authentication failed|Invalid (user|login|password)/i.test(raw)) {
      return {
        ok: false,
        error: "SMTP login failed. Check SMTP_USER and SMTP_PASSWORD (use an app password if required, e.g. Yandex).",
      };
    }
    return { ok: false, error: raw || "Failed to send email" };
  }
}
