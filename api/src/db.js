import mongoose from "mongoose";

function buildConnection() {
  if (process.env.MONGO_URI) return { uri: process.env.MONGO_URI, options: {} };

  const host = process.env.MONGO_HOST ?? "127.0.0.1";
  const port = process.env.MONGO_PORT ?? "27017";
  const db = process.env.MONGO_DB ?? "taskmanager";
  const user = process.env.MONGO_USER;
  const pass = process.env.MONGO_PASS;

  const uri = `mongodb://${host}:${port}/${db}`;

  if (user && pass) {
    return {
      uri,
      options: {
        auth: { username: user, password: pass },
        authSource: process.env.MONGO_AUTH_SOURCE ?? db,
      },
    };
  }

  // Refuse to connect to a non authed DB in prod, ok in local dev
  if (process.env.NODE_ENV === "production") {
    throw new Error("NODE_ENV=production but MONGO_USER/MONGO_PASS are not set — refusing to connect unauthenticated.");
  }

  return { uri, options: {} };
}

export async function connectDB() {
  const { uri, options } = buildConnection();
  try {
    await mongoose.connect(uri, options);
    console.log(`✓ MongoDB connected: ${uri}${options.auth ? " (authenticated)" : ""}`);
  } catch (err) {
    console.error("✗ MongoDB connection error:", err);
    process.exit(1);
  }
}
