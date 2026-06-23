import dotenv from "dotenv";

// in local load .env values, prod uses real node env vars.
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}
