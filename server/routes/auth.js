/**
 * Authentication Routes
 * Handles user registration, login, and profile retrieval
 */

import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { OAuth2Client } from "google-auth-library";
import { authenticateToken } from "../middleware/auth.js";
import multer from "multer";
import { uploadToAzure, generateUniqueBlobName } from "../utils/azureBlob.js";

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

// Google OAuth client
const googleClient = new OAuth2Client();

// Multer for avatar upload (small size limit)
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp"].includes(
      file.mimetype
    );
    cb(ok ? null : new Error("Only JPEG/PNG/WebP allowed"), ok);
  },
});

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
 * POST /api/auth/google
 * Exchange Google ID token for app JWT
 */
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: "Missing Google credential" });
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload?.email) {
      return res.status(400).json({ message: "Google token missing email" });
    }

    // Find or create user
    let user = await User.findOne({ email: payload.email });

    if (!user) {
      const fallbackUsername = payload.name?.split(" ")[0] || "google_user";
      user = await User.create({
        username: `${fallbackUsername}_${Date.now().toString(36)}`,
        email: payload.email,
        // Random password to satisfy schema; login will be via Google only
        password: jwt
          .sign({ sub: payload.sub }, process.env.JWT_SECRET)
          .slice(0, 12),
      });
    }

    const token = generateToken(user._id);

    res.json({
      message: "Logged in with Google",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Google login error:", error.message);
    res.status(401).json({ message: "Google login failed" });
  }
});

/**
 * POST /api/auth/avatar
 * Upload and set current user's avatar
 */
router.post(
  "/avatar",
  authenticateToken,
  avatarUpload.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Please select an image" });
      }

      const blobName = generateUniqueBlobName(
        req.file.originalname,
        req.user.username + "/avatar"
      );
      const blobUrl = await uploadToAzure(req.file, blobName);

      const user = await User.findByIdAndUpdate(
        req.user._id,
        { avatarUrl: blobUrl },
        { new: true }
      ).select("username email avatarUrl");

      res.json({ message: "Avatar updated", user });
    } catch (error) {
      console.error("Avatar upload error:", error.message);
      res.status(500).json({ message: "Failed to update avatar" });
    }
  }
);

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
      avatarUrl: req.user.avatarUrl,
    },
  });
});

// Storage usage: sum of photo sizes for current user; total quota 1GB
import Photo from "../models/photo.js";
router.get("/storage-usage", authenticateToken, async (req, res) => {
  try {
    const agg = await Photo.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: null, total: { $sum: "$size" } } },
    ]);
    const usedBytes = agg?.[0]?.total || 0;
    const totalBytes = 1 * 1024 * 1024 * 1024; // 1GB
    res.json({ usedBytes, totalBytes });
  } catch (e) {
    res.status(500).json({ usedBytes: 0, totalBytes: 1 * 1024 * 1024 * 1024 });
  }
});

export default router;
