import mongoose from 'mongoose';

  const otpSchema = new mongoose.Schema(
    {
      email: { type: String, required: true, lowercase: true, index: true },
      codeHash: { type: String, required: true },
      purpose: { type: String, enum: ['register', 'login'], required: true },
      expiresAt: { type: Date, required: true },
      consumed: { type: Boolean, default: false },
      attempts: { type: Number, default: 0 },
    },
    { timestamps: true },
  );

    // TTL index — Mongo deletes docs `expireAfterSeconds` after `expiresAt`.
  // Setting it to 0 means "delete as soon as expiresAt is reached."
  otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

  export const Otp = mongoose.model('Otp', otpSchema);
