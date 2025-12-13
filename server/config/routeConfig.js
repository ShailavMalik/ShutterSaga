import authRoutes from "../routes/auth.js";
import photoRoutes from "../routes/photos.js";

export function setupRoutes(app, authLimiter) {
  app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/api/auth", authLimiter, authRoutes);
  app.use("/api/photos", photoRoutes);
}
