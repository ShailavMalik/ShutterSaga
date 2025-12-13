import cors from "cors";

export function setupCORS() {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
    : [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://shuttersaga.shailavmalik.me",
        "https://shuttersaga.vercel.app",
      ];

  const corsOptions = {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  };

  return cors(corsOptions);
}
