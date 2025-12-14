import authRoutes from "../routes/auth.js";
import photoRoutes from "../routes/photos.js";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDistPath = path.join(__dirname, "../../client/dist");

export function setupRoutes(app, authLimiter) {
  app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/api/auth", authLimiter, authRoutes);
  app.use("/api/photos", photoRoutes);

  // Serve static client files
  app.use(express.static(clientDistPath, { maxAge: "1d" }));

  // SPA fallback: serve index.html for all non-API routes
  app.use((req, res) => {
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}
