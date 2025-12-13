import express from "express";
import dotenv from "dotenv";

import connectToMongoDB from "./DB/connectToMongoDB.js";
import { setupCORS } from "./middleware/corsMiddleware.js";
import {
  setupSecurity,
  setupPerformance,
} from "./middleware/securityMiddleware.js";
import { setupRateLimiting } from "./middleware/rateLimitMiddleware.js";
import { setupRoutes } from "./config/routeConfig.js";
import { setupErrorHandling } from "./handlers/errorHandler.js";
import { gracefulShutdown } from "./handlers/shutdownHandler.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";

async function startServer() {
  try {
    await connectToMongoDB();

    // Middleware
    app.use(setupCORS());
    app.use(setupSecurity());
    setupPerformance(isProduction).forEach((mw) => app.use(mw));

    // Rate limiting
    const { limiter, authLimiter } = setupRateLimiting(isProduction);
    app.use("/api", limiter);

    // Routes and error handling
    setupRoutes(app, authLimiter);
    setupErrorHandling(app, isProduction);

    // Start listening
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    process.on("SIGTERM", () => gracefulShutdown(server, "SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown(server, "SIGINT"));
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

startServer();
