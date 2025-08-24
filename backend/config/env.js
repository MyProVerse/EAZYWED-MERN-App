import dotenv from "dotenv";

dotenv.config();

export const {
  MONGO_URI,
  PORT = 5000,
  JWT_SECRET,
  TWILIO_PHONE,
  TWILIO_SID,
  TWILIO_AUTH_TOKEN,
  NODE_ENV = "development",
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  FRONTEND_URL = "http://localhost:5173",
  EMAIL_USERNAME,
  EMAIL_PASSWORD,
} = process.env;

// Log to verify env vars are loaded (remove after testing)
console.log("Env Loaded:", {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: CLOUDINARY_API_SECRET ? "[REDACTED]" : undefined,
});