/**
 * Authentication Routes
 * Handles user registration, login, and profile retrieval
 */

import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

/**
 * Generate a JWT token for a user
 * @param {string} userId - The user's MongoDB _id
 * @returns {string} - Signed JWT token
 */
function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

/**
 * POST /api/auth/register
 * Create a new user account
 */
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if username or email is already taken
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      const field = existingUser.email === email ? "Email" : "Username";
      return res.status(400).json({
        message: `${field} is already registered`,
      });
    }

    // Create and save the new user (password gets hashed automatically)
    const user = new User({ username, email, password });
    await user.save();

    // Generate token for immediate login after registration
    const token = generateToken(user._id);

    res.status(201).json({
      message: "Account created successfully!",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res
      .status(500)
      .json({ message: "Could not create account. Please try again." });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return token
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate token for the session
    const token = generateToken(user._id);

    res.json({
      message: "Welcome back!",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed. Please try again." });
  }
});

/**
 * GET /api/auth/me
 * Get current user's profile (requires authentication)
 */
router.get("/me", authenticateToken, async (req, res) => {
  // User is already attached to req by the auth middleware
  res.json({
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
    },
  });
});

export default router;
