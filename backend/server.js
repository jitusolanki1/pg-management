/**
 * PG Management Server - Bank-Grade Security
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import helmet from "helmet";
import authRoutes from "./routes/auth.js";
import floorRoutes from "./routes/floors.js";
import roomRoutes from "./routes/rooms.js";
import bedRoutes from "./routes/beds.js";
import planRoutes from "./routes/plans.js";
import tenantRoutes from "./routes/tenants.js";
import paymentRoutes from "./routes/payments.js";
import dashboardRoutes from "./routes/dashboard.js";
import leadRoutes from "./routes/leads.js";
import adminVerifyRoutes from "./routes/adminVerify.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { apiRateLimiter, ipBlocker } from "./middleware/security.js";
import { authenticate } from "./middleware/auth.js";
import { initializeDatabases } from "./config/database.js";

dotenv.config();

const app = express();

// Trust proxy for accurate IP detection
app.set("trust proxy", 1);

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: [
          "'self'",
          "https://*.firebaseapp.com",
          "https://*.googleapis.com",
        ],
        frameSrc: ["'self'", "https://*.firebaseapp.com"],
        fontSrc: ["'self'", "https:", "data:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

const allowedOrigins = process.env.FRONTEND_URL;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`⚠️ Blocked CORS request from: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Session-Token",
      "X-Request-Timestamp",
      "X-Request-Nonce",
    ],
    exposedHeaders: ["X-Token-Expiry"],
  })
);

// Body parsers with size limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Global IP blocking
app.use(ipBlocker);

// Global rate limiting
app.use(apiRateLimiter);

// Auth routes (has its own rate limiting)
app.use("/api/auth", authRoutes);

// Admin verification routes (public - for multi-step auth)
app.use("/api/admin-verify", adminVerifyRoutes);

// Public lead submission (no auth required - for tenant registration)
app.post("/api/leads/public", async (req, res, next) => {
  // Forward to leads router's /public endpoint handler
  req.url = "/public";
  leadRoutes(req, res, next);
});

// Protected routes - require authentication
app.use("/api/floors", authenticate, floorRoutes);
app.use("/api/rooms", authenticate, roomRoutes);
app.use("/api/beds", authenticate, bedRoutes);
app.use("/api/plans", authenticate, planRoutes);
app.use("/api/tenants", authenticate, tenantRoutes);
app.use("/api/payments", authenticate, paymentRoutes);
app.use("/api/dashboard", authenticate, dashboardRoutes);
app.use("/api/leads", authenticate, leadRoutes);

// Health check (public)
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    security: "Bank-Grade OTP Authentication",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Error handling (sanitized - no stack traces)
app.use(errorHandler);

// Start server with dual database connections
initializeDatabases().then(() => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔐 Security: Bank-Grade OTP Authentication Enabled`);
    console.log(`📦 Databases: Production (pg) + Development (pg_dev)`);
    console.log(
      `📧 Login alerts will be sent to: ${
        process.env.ADMIN_EMAIL || "console (dev mode)"
      }`
    );
  });
});
