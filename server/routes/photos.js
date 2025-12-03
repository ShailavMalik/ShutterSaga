/**
 * Photo Routes
 * Handles photo upload, retrieval, and deletion
 */

import express from "express";
import multer from "multer";
import Photo from "../models/photo.js";
import { authenticateToken } from "../middleware/auth.js";
import {
  uploadToAzure,
  deleteFromAzure,
  generateUniqueBlobName,
} from "../utils/azureBlob.js";

const router = express.Router();

// Allowed image types
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Configure multer for handling file uploads
 * Files are stored in memory temporarily before uploading to Azure
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, callback) => {
    if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new Error("Only JPEG, PNG, GIF, and WebP images are allowed"));
    }
  },
});

/**
 * POST /api/photos/upload
 * Upload a new photo to Azure and save metadata to MongoDB
 */
router.post(
  "/upload",
  authenticateToken,
  upload.single("photo"),
  async (req, res) => {
    try {
      // Validate file was uploaded
      if (!req.file) {
        return res
          .status(400)
          .json({ message: "Please select a photo to upload" });
      }

      const { title, description } = req.body;

      // Title is required
      if (!title || !title.trim()) {
        return res
          .status(400)
          .json({ message: "Please provide a title for your photo" });
      }

      // Generate a unique name in user's directory and upload to Azure
      const blobName = generateUniqueBlobName(
        req.file.originalname,
        req.user.username
      );
      const blobUrl = await uploadToAzure(req.file, blobName);

      // Save the photo metadata to our database
      const photo = new Photo({
        title: title.trim(),
        description: description?.trim() || "",
        blobUrl,
        blobName,
        user: req.user._id,
        contentType: req.file.mimetype,
        size: req.file.size,
      });

      await photo.save();

      res.status(201).json({
        message: "Photo uploaded successfully!",
        photo: {
          id: photo._id,
          title: photo.title,
          description: photo.description,
          blobUrl: photo.blobUrl,
          createdAt: photo.createdAt,
        },
      });
    } catch (error) {
      console.error("Upload error:", error.message);
      res.status(500).json({
        message: error.message || "Failed to upload photo. Please try again.",
      });
    }
  }
);

/**
 * GET /api/photos
 * Get all photos for the current user
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    // Fetch user's photos, newest first
    const photos = await Photo.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select("title description blobUrl createdAt");

    res.json({ photos });
  } catch (error) {
    console.error("Fetch photos error:", error);
    res.status(500).json({ message: "Could not load photos" });
  }
});

/**
 * GET /api/photos/:id
 * Get a single photo by ID
 */
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    // Only allow users to view their own photos
    const photo = await Photo.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!photo) {
      return res.status(404).json({ message: "Photo not found" });
    }

    res.json({ photo });
  } catch (error) {
    console.error("Fetch photo error:", error);
    res.status(500).json({ message: "Could not load photo" });
  }
});

/**
 * DELETE /api/photos/:id
 * Delete a photo from both Azure and MongoDB
 */
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    // Find the photo (only if it belongs to this user)
    const photo = await Photo.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!photo) {
      return res.status(404).json({ message: "Photo not found" });
    }

    // Delete from Azure Blob Storage first
    await deleteFromAzure(photo.blobName);

    // Then remove from our database
    await Photo.deleteOne({ _id: photo._id });

    res.json({ message: "Photo deleted successfully" });
  } catch (error) {
    console.error("Delete photo error:", error);
    res.status(500).json({ message: "Could not delete photo" });
  }
});

export default router;
