import crypto from "node:crypto";
import { Otp } from "../models/Otp.js";
import { emailService } from "./email.service.js";
import { renderOtpEmail } from "./email.templates.js";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"; // 36 chars, no ambiguous chars filtered
const TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_MS = 60 * 1000; // 1 OTP per minute per address and purpose

function generateCode() {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += ALPHABET[crypto.randomInt(0, ALPHABET.length)];
  }
  return code;
}

function hashCode(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export async function sendOtp(email, purpose) {
  // Rate limit
  const recent = await Otp.findOne({
    email,
    purpose,
    createdAt: { $gte: new Date(Date.now() - RATE_LIMIT_MS) },
  });
  if (recent) {
    const err = new Error("Please wait a minute before requesting another code");
    err.code = "RATE_LIMITED";
    throw err;
  }

  // Invalidate any existing un-consumed OTPs
  await Otp.updateMany({ email, purpose, consumed: false }, { consumed: true });

  const code = generateCode();
  await Otp.create({
    email,
    purpose,
    codeHash: hashCode(code),
    expiresAt: new Date(Date.now() + TTL_MS),
  });

  const { subject, html, text } = renderOtpEmail(purpose, { code });
  await emailService.send({ to: email, subject, html, text });
}

export async function verifyOtp(email, code, purpose) {
  // Find the latest un-consumed, un-expired OTP for this email+purpose
  const otp = await Otp.findOne({
    email,
    purpose,
    consumed: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!otp) {
    // we were showing a different message here, but it served as an attack vector for discerning real accounts
    // so now we mimic the invlaid or expired messaging
    const err = new Error("Invalid or expired code");
    err.code = "INVALID_OR_EXPIRED"; // ← unified code
    throw err;
  }

  if (otp.attempts >= MAX_ATTEMPTS) {
    otp.consumed = true;
    await otp.save();
    const err = new Error("Too many attempts — request a new code");
    err.code = "TOO_MANY_ATTEMPTS";
    throw err;
  }

  otp.attempts += 1;

  const valid = otp.codeHash === hashCode(code.toUpperCase());
  if (!valid) {
    await otp.save(); // persist the attempt count
    const err = new Error("Invalid or expired code"); // ← same message as NO_OTP
    err.code = "INVALID_OR_EXPIRED";
    throw err;
  }

  otp.consumed = true;
  await otp.save();
}
