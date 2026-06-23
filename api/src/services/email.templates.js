import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import nunjucks from "nunjucks";

// Templates live in ../emails
const emailsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "emails");
const env = nunjucks.configure(emailsDir, {
  autoescape: true,
  noCache: process.env.NODE_ENV !== "production",
});

const APP_NAME = process.env.APP_NAME ?? "Task Manager";
const EXPIRY_MINUTES = 10; // keep in sync with TTL_MS in otp.service.js

const TEMPLATES = {
  register: { subject: "Verify your email", file: "register.njk", preheader: "Your verification code" },
  login: { subject: "Your login code", file: "login.njk", preheader: "Your one-time login code" },
};

/**
 * Render an OTP email for a 'register' or 'login' into the parts nodemailer
 * needs. Returns { subject, html, text } — text is a plain-text fallback (also what the
 * dev ConsoleEmailService logs, so the code stays visible in the console).
 *
 * `vars` is spread into the template context, so any extra value (code, username,
 * email, …) becomes available as {{ that }} in the .njk files. dev preview routes
 * use this to drive templates from URL query params.
 */
export function renderOtpEmail(purpose, vars = {}) {
  const t = TEMPLATES[purpose] ?? TEMPLATES.register;
  const html = env
    .render(t.file, {
      appName: APP_NAME,
      expiryMinutes: EXPIRY_MINUTES,
      year: new Date().getFullYear(),
      subject: t.subject,
      preheader: t.preheader,
      ...vars,
    })
    .trim(); // strip the leading newline left by template comments/{% extends %}
  const text = [t.subject, "", `Your code is: ${vars.code}`, "", `It expires in ${EXPIRY_MINUTES} minutes.`, "", "If you didn't request this, ignore this email."].join("\n");
  return { subject: t.subject, html, text };
}
