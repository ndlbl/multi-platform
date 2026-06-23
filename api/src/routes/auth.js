import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { authRequired } from "../middleware/auth.js";
import { sendOtp, verifyOtp } from "../services/otp.service.js";

const router = Router();

function validatePassword(password) {
  if (typeof password !== "string") return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[a-z]/.test(password)) return "Password must contain a lowercase letter";
  if (!/[A-Z]/.test(password)) return "Password must contain an uppercase letter";
  if (!/\d/.test(password)) return "Password must contain a number";
  if (!/[^a-zA-Z0-9]/.test(password)) return "Password must contain a special character";
  return null;
}

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES ?? "7d" });
}

function otpErrorStatus(code) {
  if (code === "RATE_LIMITED") return 429;
  if (code === "INVALID_OR_EXPIRED" || code === "TOO_MANY_ATTEMPTS") return 400;
  return 500;
}

// ─── create unverified user and trigger OTP for email validation/verification
router.post("/register", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email is required" });
    }
    const pwError = validatePassword(password);
    if (pwError) return res.status(400).json({ error: pwError });

    const lower = email.toLowerCase();
    const existing = await User.findOne({ email: lower });

    if (existing?.emailVerified) {
      return res.status(409).json({ error: "Email already registered" });
    }

    if (existing) {
      existing.passwordHash = await bcrypt.hash(password, 12);
      await existing.save();
    } else {
      const passwordHash = await bcrypt.hash(password, 12);
      await User.create({ email: lower, passwordHash, emailVerified: false });
    }

    try {
      await sendOtp(lower, "register");
    } catch (err) {
      return res.status(otpErrorStatus(err.code)).json({ error: err.message });
    }

    res.status(201).json({ message: "Verification code sent to your email", email: lower });
  } catch (err) {
    next(err);
  }
});

// ─── verify user - consume OTP, issue JWT
router.post("/verify-email", async (req, res, next) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: "Email and code are required" });
    }

    try {
      await verifyOtp(email.toLowerCase(), code, "register");
    } catch (err) {
      return res.status(otpErrorStatus(err.code)).json({ error: err.message });
    }

    const user = await User.findOneAndUpdate({ email: email.toLowerCase() }, { emailVerified: true }, { new: true });
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ user, token: signToken(user) });
  } catch (err) {
    next(err);
  }
});

// ─── login blocks unverified users
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    const valid = user && (await bcrypt.compare(password, user.passwordHash));
    if (!valid) return res.status(401).json({ error: "Invalid email or password" });

    if (!user.emailVerified) {
      return res.status(403).json({
        error: "Email not verified. Check your inbox for a code or request a new one.",
        requiresVerification: true,
      });
    }

    res.json({ user, token: signToken(user) });
  } catch (err) {
    next(err);
  }
});

// ─── request login via OTP
router.post("/request-login-otp", async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const lower = email.toLowerCase();
    const user = await User.findOne({ email: lower });

    // Only actually send if user exists AND is verified.
    // Always respond with the same message to prevent email enumeration.
    if (user?.emailVerified) {
      try {
        await sendOtp(lower, "login");
      } catch (err) {
        if (err.code === "RATE_LIMITED") {
          return res.status(429).json({ error: err.message });
        }
        return next(err);
      }
    }

    res.json({ message: "If that email is registered and verified, a code has been sent" });
  } catch (err) {
    next(err);
  }
});

// ─── login with OTP
router.post("/login-with-otp", async (req, res, next) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: "Email and code are required" });
    }

    try {
      await verifyOtp(email.toLowerCase(), code, "login");
    } catch (err) {
      return res.status(otpErrorStatus(err.code)).json({ error: err.message });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: "User not found" });

    // sync emailVerified if it wasn't already
    if (!user.emailVerified) {
      user.emailVerified = true;
      await user.save();
    }

    res.json({ user, token: signToken(user) });
  } catch (err) {
    next(err);
  }
});

// ─── resend OTP
router.post("/resend-otp", async (req, res, next) => {
  try {
    const { email, purpose } = req.body;
    if (!email || !purpose) {
      return res.status(400).json({ error: "Email and purpose are required" });
    }
    if (!["register", "login"].includes(purpose)) {
      return res.status(400).json({ error: "Invalid purpose" });
    }

    const lower = email.toLowerCase();
    const user = await User.findOne({ email: lower });

    // Silent no-op cases (enumeration safety): for register: only resend if unverified user exists
    // for login: only resend if verified user exists
    const shouldSend = (purpose === "register" && user && !user.emailVerified) || (purpose === "login" && user?.emailVerified);

    if (shouldSend) {
      try {
        await sendOtp(lower, purpose);
      } catch (err) {
        if (err.code === "RATE_LIMITED") {
          return res.status(429).json({ error: err.message });
        }
        return next(err);
      }
    }

    res.json({ message: "OK" });
  } catch (err) {
    next(err);
  }
});

// ─── /me
router.get("/me", authRequired, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

export default router;
