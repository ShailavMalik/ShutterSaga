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
  upload.array("photos", 10),
  async (req, res) => {
    try {
      const files = req.files || [];

      if (!files.length) {
        return res
          .status(400)
          .json({ message: "Please select at least one photo to upload" });
      }

      const { title, description, defaultCaption } = req.body;

      const uploads = await Promise.all(
        files.map(async (file, index) => {
          const blobName = generateUniqueBlobName(
            file.originalname,
            req.user.username
          );
          const blobUrl = await uploadToAzure(file, blobName);

          const photo = new Photo({
            title: (title || file.originalname || "Untitled").trim(),
            description: (description || defaultCaption || "").trim(),
            blobUrl,
            blobName,
            user: req.user._id,
            contentType: file.mimetype,
            size: file.size,
          });

          await photo.save();

          return {
            id: photo._id,
            title: photo.title,
            description: photo.description,
            blobUrl: photo.blobUrl,
            createdAt: photo.createdAt,
          };
        })
      );

      res.status(201).json({
        message: `Uploaded ${uploads.length} photo(s) successfully!`,
        photos: uploads,
      });
    } catch (error) {
      console.error("Upload error:", error.message);
      res.status(500).json({
        message: error.message || "Failed to upload photos. Please try again.",
      });
    }
  }
);

/**
 * GET /api/photos/export
 * Get all photos for current user with sizes for export
 */
router.get("/export", authenticateToken, async (req, res) => {
  try {
    const photos = await Photo.find({ user: req.user._id }).select(
      "title description blobUrl size createdAt"
    );
    res.json({ photos });
  } catch (error) {
    res.status(500).json({ message: "Failed to load photos for export" });
  }
});

/**
 * POST /api/photos
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
