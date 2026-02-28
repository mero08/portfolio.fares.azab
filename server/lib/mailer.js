import nodemailer from "nodemailer";

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export function getTransport() {
  // Option A (recommended): SMTP credentials
  // SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS
  if (process.env.SMTP_HOST) {
    const host = requireEnv("SMTP_HOST");
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = String(process.env.SMTP_SECURE || "false") === "true";
    const user = requireEnv("SMTP_USER");
    const pass = requireEnv("SMTP_PASS");

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
  }); }

  // Option B: Gmail using an "App Password" (not your normal password)
  // GMAIL_USER, GMAIL_APP_PASSWORD
  if (process.env.GMAIL_USER) {
    const user = requireEnv("GMAIL_USER");
    const pass = requireEnv("GMAIL_APP_PASSWORD");
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  }

  throw new Error(
    "No mail transport configured. Set SMTP_* or GMAIL_* environment variables.",
  );
}

export function getMailDefaults() {
  const to = requireEnv("CONTACT_TO_EMAIL");
  const from =
    process.env.CONTACT_FROM_EMAIL ||
    process.env.SMTP_USER ||
    process.env.GMAIL_USER ||
    to;
  return { to, from };
}
