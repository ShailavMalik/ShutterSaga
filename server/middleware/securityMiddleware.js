import helmet from "helmet";
import compression from "compression";
import express from "express";
import morgan from "morgan";

// Configure security headers
export function setupSecurity() {
  return helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } });
}

// Configure compression, parsing, and logging
export function setupPerformance(isProduction) {
  const middlewares = [
    compression(), // Compress responses
    express.json({ limit: "1mb" }), // Parse JSON bodies
    express.urlencoded({ extended: true, limit: "1mb" }), // Parse URL-encoded bodies
    morgan(isProduction ? "combined" : "dev"), // Log HTTP requests
  ];
  return middlewares;
}
