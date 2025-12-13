export function setupErrorHandling(app, isProduction) {
  app.use((req, res) => {
    res.status(404).json({ message: "Endpoint not found" });
  });

  app.use((err, req, res, _next) => {
    console.error("Error:", err.message);

    if (err.message === "Not allowed by CORS") {
      return res.status(403).json({ message: "CORS policy violation" });
    }

    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }

    if (err.name === "MulterError") {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "File too large. Maximum size is 10MB."
          : err.message;
      return res.status(400).json({ message });
    }

    res.status(err.status || 500).json({
      message: isProduction
        ? "Something went wrong. Please try again later."
        : err.message,
    });
  });
}
