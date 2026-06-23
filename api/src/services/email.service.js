import nodemailer from "nodemailer";

// useful during dev to just see the mails in the console.
class ConsoleEmailService {
  async send({ to, subject, text, html }) {
    console.log("\n📧 EMAIL ─────────────────────────────────────");
    console.log(`  To:      ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body:`);
    console.log(
      (text ?? html ?? "")
        .split("\n")
        .map((l) => `    ${l}`)
        .join("\n"),
    );
    console.log("─────────────────────────────────────────────\n");
  }
}

//  email via SMTP (nodemailer). Used only SMTP_HOST is configured.
class SmtpEmailService {
  constructor() {
    const port = Number(process.env.SMTP_PORT ?? 587);
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      // Port 465 uses implicit TLS - SMTP_SECURE overrides.
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
    this.from = process.env.SMTP_FROM ?? process.env.SMTP_USER;
  }

  async send({ to, subject, html, text }) {
    // Send multipart - HTML body and a plain-text fallback.
    await this.transporter.sendMail({ from: this.from, to, subject, html, text });
  }
}

export const emailService = process.env.SMTP_HOST ? new SmtpEmailService() : new ConsoleEmailService();

console.log(`✉️  Email service: ${process.env.SMTP_HOST ? `SMTP (${process.env.SMTP_HOST})` : "console (dev)"}`);
