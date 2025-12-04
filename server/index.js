/**
 * ShutterSaga Backend Server
 * Production-ready Express application
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import dotenv from "dotenv";

import connectToMongoDB from "./DB/connectToMongoDB.js";
import authRoutes from "./routes/auth.js";
import photoRoutes from "./routes/photos.js";

// Load environment variables first
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";

/* ============================================
   CORS Configuration (MUST be first!)
============================================ */

// Allowed origins for CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
      .map((o) => o.trim())
      .filter((o) => o.length > 0) // Remove empty strings
  : [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://shuttersaga.shailavmalik.me",
      "http://shuttersaga.shailavmalik.me",
    ];

console.log("✅ Allowed CORS origins:", allowedOrigins);

// CORS options
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(
        `⚠️  CORS blocked origin: "${origin}" (not in ${JSON.stringify(
          allowedOrigins
        )})`
      );
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  maxAge: 3600, // Cache preflight for 1 hour
  optionsSuccessStatus: 200,
};

// Enable CORS - must be before other middleware
// The cors middleware automatically handles OPTIONS preflight requests
app.use(cors(corsOptions));

/* ============================================
   Security Middleware
============================================ */

// Helmet sets various HTTP headers for security
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow images to load from Azure
  })
);

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 100 : 1000, // Limit each IP (stricter in production)
  message: { message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// Stricter rate limit for auth routes (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 10 : 100, // 10 attempts per 15 min in production
  message: { message: "Too many login attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

/* ============================================
   Performance Middleware
============================================ */

// Compress responses for better performance
app.use(compression());

// Parse incoming JSON data (with size limit for security)
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Request logging
if (isProduction) {
  // Production: minimal logging
  app.use(morgan("combined"));
} else {
  // Development: colored, detailed logging
  app.use(morgan("dev"));
}

/* ============================================
   Health Check
============================================ */

// Health check endpoint (useful for load balancers & monitoring)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    name: "ShutterSaga API",
    version: "1.0.0",
    status: "running",
  });
});

/* ============================================
   API Routes
============================================ */

// Authentication routes with stricter rate limiting
app.use("/api/auth", authLimiter, authRoutes);

// Photo management routes
app.use("/api/photos", photoRoutes);

/* ============================================
   Error Handling
============================================ */

// Handle 404 - Route not found
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

// Global error handler (next param required by Express for error middleware signature)
app.use((err, req, res, _next) => {
  // Log error details (but don't expose them in production)
  console.error("Server Error:", err.message);
  if (!isProduction) {
    console.error(err.stack);
  }

  // Handle specific error types
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ message: "CORS policy violation" });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({ message: err.message });
  }

  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ message: "File too large. Maximum size is 10MB." });
    }
    return res.status(400).json({ message: err.message });
  }

  // Generic error response
  res.status(err.status || 500).json({
    message: isProduction
      ? "Something went wrong. Please try again later."
      : err.message,
  });
});

/* ============================================
   Graceful Shutdown
============================================ */

let server;

function gracefulShutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  server?.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error("Forcing shutdown...");
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

/* ============================================
   Start Server
============================================ */

connectToMongoDB()
  .then(() => {
    server = app.listen(PORT, () => {
      console.log(`\n🚀 ShutterSaga API Server`);
      console.log(
        `   Environment: ${isProduction ? "production" : "development"}`
      );
      console.log(`   Port: ${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/health\n`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  });
