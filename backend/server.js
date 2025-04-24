import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { PORT, NODE_ENV, FRONTEND_URL } from "./config/env.js";
import connectDB from "./config/db.js";
import userRoutes from "./routes/user.js";
import adminRoutes from "./routes/admin.js";
import authRoutes from "./routes/auth.js";
import vendorRoutes from "./routes/vendor.js";
import dashboardRoutes from "./routes/dashboard.js";
import vendorDashboardRoutes from "./routes/vendorDashboard.js";
import publicRoutes from "./routes/public.js";
import cron from "node-cron";
import Booking from "./models/Booking.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

dotenv.config();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000000,
  message: "Too many requests from this IP, please try again after 15 minutes",
});

async function startServer() {
  try {
    await connectDB();

    const app = express();

    app.use(helmet());
    app.use(limiter);
    app.use(cors({ origin: FRONTEND_URL, credentials: true }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());
    app.use(fileUpload({ limits: { fileSize: 5 * 1024 * 1024 }, abortOnLimit: true }));

    // Ensure uploads directory exists
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const uploadsDir = path.join(__dirname, "uploads");

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log("Created uploads directory:", uploadsDir);
    }

    app.use("/users", userRoutes);
    app.use("/admins", adminRoutes);
    app.use("/auth", authRoutes);
    app.use("/vendor", vendorRoutes);
    app.use("/dashboard", dashboardRoutes);
    app.use("/vendor/dashboard", vendorDashboardRoutes);
    app.use("/api/public", publicRoutes);
    app.use("/uploads", express.static(uploadsDir));

    cron.schedule("0 0 * * *", async () => {
      try {
        const now = new Date();
        console.log(`[CRON] Running booking auto-completion job at ${now.toISOString()}`);

        const result = await Booking.updateMany(
          { status: "confirmed", event_date: { $lt: now } },
          { $set: { status: "completed", completed_at: now, reviewAllowed: true } }
        );

        console.log(`[CRON] Auto-completed ${result.modifiedCount} bookings`);
      } catch (error) {
        console.error("[CRON] Error in auto-completion job:", error);
      }
    });

    app.use((err, req, res, next) => {
      console.error("Server error:", err.stack);
      res.status(500).json({
        message: "Internal server error",
        error: NODE_ENV === "development" ? err.message : undefined,
      });
    });

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} in ${NODE_ENV} mode`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();