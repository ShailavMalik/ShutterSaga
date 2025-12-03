/**
 * Upload Page
 * Allows users to upload photos with title and description
 */

import { useState } from "react";
import { photosAPI } from "../services/api";
import "./UploadPage.css";

function UploadPage() {
  // File state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // UI state
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Handle file selection
  function handleFileSelect(e) {
    const file = e.target.files[0];

    if (file) {
      setSelectedFile(file);
      // Create preview URL for the image
      setPreviewUrl(URL.createObjectURL(file));
      setMessage({ type: "", text: "" });
    }
  }

  // Clear the selected file
  function clearSelectedFile() {
    setSelectedFile(null);
    setPreviewUrl(null);
  }

  // Handle form submission
  async function handleSubmit(e) {
    e.preventDefault();

    // Validation
    if (!selectedFile) {
      setMessage({ type: "error", text: "Please select a photo to upload" });
      return;
    }

    if (!title.trim()) {
      setMessage({ type: "error", text: "Please give your photo a title" });
      return;
    }

    setIsUploading(true);
    setMessage({ type: "", text: "" });

    try {
      // Build form data for multipart upload
      const formData = new FormData();
      formData.append("photo", selectedFile);
      formData.append("title", title.trim());
      formData.append("description", description.trim());

      await photosAPI.upload(formData);

      // Success! Clear the form
      setMessage({ type: "success", text: "Photo uploaded successfully! 🎉" });
      setSelectedFile(null);
      setPreviewUrl(null);
      setTitle("");
      setDescription("");
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Failed to upload photo. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="upload-page">
      <div className="upload-container">
        <h1>Upload Photo</h1>
        <p className="subtitle">Share your beautiful moments</p>

        {/* Status message */}
        {message.text && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}

        <form onSubmit={handleSubmit} className="upload-form">
          {/* File upload area */}
          <div className="file-upload-area">
            {previewUrl ? (
              // Show preview when file is selected
              <div className="preview-container">
                <img src={previewUrl} alt="Preview" className="preview-image" />
                <button
                  type="button"
                  onClick={clearSelectedFile}
                  className="clear-btn"
                  aria-label="Remove selected photo">
                  ✕
                </button>
              </div>
            ) : (
              // Show upload prompt
              <label className="file-label">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleFileSelect}
                  className="file-input"
                />
                <div className="file-placeholder">
                  <span className="upload-icon">📤</span>
                  <span>Click to select an image</span>
                  <span className="file-hint">
                    JPEG, PNG, GIF, WebP (max 10MB)
                  </span>
                </div>
              </label>
            )}
          </div>

          {/* Title input */}
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your photo a title"
              required
            />
          </div>

          {/* Description input */}
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description (optional)"
              rows={3}
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="upload-btn"
            disabled={isUploading || !selectedFile}>
            {isUploading ? "Uploading..." : "Upload Photo"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default UploadPage;
