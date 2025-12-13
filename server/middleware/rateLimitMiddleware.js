import rateLimit from "express-rate-limit";

export function setupRateLimiting(isProduction) {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProduction ? 100 : 1000,
    message: "Too many requests, please try again later.",
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProduction ? 10 : 100,
    message: "Too many login attempts, please try again later.",
  });

  return { limiter, authLimiter };
}
