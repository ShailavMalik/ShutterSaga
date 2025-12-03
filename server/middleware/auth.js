/**
 * Authentication Middleware
 * Protects routes by verifying JWT tokens
 */

import jwt from "jsonwebtoken";
import User from "../models/user.js";

/**
 * Middleware to authenticate requests using JWT
 * Extracts token from Authorization header and verifies it
 */
export const authenticateToken = async (req, res, next) => {
  try {
    // Get the Authorization header
    const authHeader = req.headers.authorization;

    // Token should be in format: "Bearer <token>"
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Access token is required" });
    }

    // Verify the token and extract the payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user and exclude password from the result
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    // Attach user to request object for use in route handlers
    req.user = user;
    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Your session has expired. Please login again." });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(403).json({ message: "Invalid token" });
    }

    return res.status(403).json({ message: "Authentication failed" });
  }
};
