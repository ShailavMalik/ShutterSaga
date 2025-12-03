/**
 * Photo Model
 * Stores metadata about uploaded photos (actual files are in Azure Blob Storage)
 */

import mongoose from "mongoose";

const photoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Photo title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    // URL to access the photo from Azure Blob Storage
    blobUrl: {
      type: String,
      required: true,
    },
    // Unique identifier for the blob in Azure Storage
    blobName: {
      type: String,
      required: true,
    },
    // Reference to the user who uploaded this photo
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // MIME type of the image (e.g., "image/jpeg")
    contentType: {
      type: String,
      required: true,
    },
    // File size in bytes
    size: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true, // Automatically track when photos are added/updated
  }
);

const Photo = mongoose.model("Photo", photoSchema);

export default Photo;
