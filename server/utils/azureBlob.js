/**
 * Azure Blob Storage Utilities
 * Handles uploading and deleting images from Azure Blob Storage
 * Organizes files into user-specific directories
 */

import { BlobServiceClient } from "@azure/storage-blob";

// Cache the container client so we don't recreate it on every request
let containerClient = null;

/**
 * Get or create the Azure Blob container client
 * Creates the container if it doesn't exist
 */
async function getContainerClient() {
  // Return cached client if available
  if (containerClient) {
    return containerClient;
  }

  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const containerName = process.env.AZURE_CONTAINER_NAME || "photos";

  // Make sure we have the connection string
  if (!connectionString) {
    throw new Error("Azure Storage connection string is not configured");
  }

  // Create the blob service and container clients
  const blobServiceClient =
    BlobServiceClient.fromConnectionString(connectionString);
  containerClient = blobServiceClient.getContainerClient(containerName);

  // Create the container if it doesn't exist (with public blob access)
  await containerClient.createIfNotExists({
    access: "blob", // Anyone can read blobs, but only we can list/write
  });

  return containerClient;
}

/**
 * Sanitize username for use as a directory name
 * Removes special characters and converts to lowercase
 * @param {string} username - The user's username
 * @returns {string} - Safe directory name
 */
function sanitizeUsername(username) {
  return username
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-") // Replace special chars with dash
    .replace(/-+/g, "-") // Remove consecutive dashes
    .replace(/^-|-$/g, ""); // Remove leading/trailing dashes
}

/**
 * Upload a file to Azure Blob Storage in user's directory
 * @param {Object} file - The file object from multer (has buffer and mimetype)
 * @param {string} blobName - Unique name for the blob (includes user directory)
 * @returns {string} - URL to access the uploaded blob
 */
export async function uploadToAzure(file, blobName) {
  const container = await getContainerClient();
  const blockBlobClient = container.getBlockBlobClient(blobName);

  // Upload the file buffer with the correct content type
  await blockBlobClient.uploadData(file.buffer, {
    blobHTTPHeaders: {
      blobContentType: file.mimetype,
    },
  });

  return blockBlobClient.url;
}

/**
 * Delete a blob from Azure Storage
 * @param {string} blobName - Full path of the blob to delete (includes user directory)
 */
export async function deleteFromAzure(blobName) {
  const container = await getContainerClient();
  const blockBlobClient = container.getBlockBlobClient(blobName);

  // Delete if exists (won't throw if already deleted)
  await blockBlobClient.deleteIfExists();
}

/**
 * Generate a unique blob name with user directory
 * Creates path like: username/timestamp-randomstring.ext
 * @param {string} originalName - Original filename
 * @param {string} username - User's username for directory
 * @returns {string} - Full blob path with user directory
 */
export function generateUniqueBlobName(originalName, username) {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split(".").pop().toLowerCase();

  // Create user directory structure: username/filename.ext
  const safeUsername = sanitizeUsername(username);

  return `${safeUsername}/${timestamp}-${randomPart}.${extension}`;
}
