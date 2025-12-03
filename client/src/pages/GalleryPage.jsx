/**
 * Gallery Page
 * Displays user's photos in a grid with a lightbox viewer and navigation
 */

import { useState, useEffect, useCallback } from "react";
import { photosAPI } from "../services/api";
import "./GalleryPage.css";

function GalleryPage() {
  // Photos data
  const [photos, setPhotos] = useState([]);

  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Lightbox state - store index instead of photo object for easier navigation
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Load photos when component mounts
  useEffect(() => {
    loadPhotos();
  }, []);

  // Keyboard navigation for lightbox
  useEffect(() => {
    function handleKeyDown(e) {
      if (currentPhotoIndex === null) return;

      switch (e.key) {
        case "ArrowLeft":
          goToPrevious();
          break;
        case "ArrowRight":
          goToNext();
          break;
        case "Escape":
          closeLightbox();
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPhotoIndex, photos.length]);

  // Fetch all photos from the API
  async function loadPhotos() {
    try {
      setIsLoading(true);
      const response = await photosAPI.getAll();
      setPhotos(response.data.photos);
    } catch (err) {
      setError("Failed to load your photos. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // Delete a photo
  async function handleDelete(photoId, e) {
    e.stopPropagation(); // Don't open lightbox when clicking delete

    if (!window.confirm("Are you sure you want to delete this photo?")) {
      return;
    }

    setDeletingId(photoId);

    try {
      await photosAPI.delete(photoId);

      // Remove from local state
      setPhotos((prev) => prev.filter((p) => p._id !== photoId));

      // Close lightbox if we deleted the current photo
      if (currentPhoto?._id === photoId) {
        closeLightbox();
      }
    } catch (err) {
      alert("Failed to delete photo. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  // Lightbox functions
  function openLightbox(index) {
    setCurrentPhotoIndex(index);
  }

  function closeLightbox() {
    setCurrentPhotoIndex(null);
  }

  function goToPrevious() {
    setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  }

  function goToNext() {
    setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  }

  // Get current photo for lightbox
  const currentPhoto =
    currentPhotoIndex !== null ? photos[currentPhotoIndex] : null;

  // Loading state
  if (isLoading) {
    return (
      <div className="gallery-page">
        <div className="loading">Loading your photos...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="gallery-page">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="gallery-page">
      {/* Header */}
      <div className="gallery-header">
        <h1>My Gallery</h1>
        <p className="photo-count">
          {photos.length} {photos.length === 1 ? "photo" : "photos"}
        </p>
      </div>

      {/* Empty state */}
      {photos.length === 0 ? (
        <div className="empty-gallery">
          <span className="empty-icon">📷</span>
          <h2>No photos yet</h2>
          <p>Upload your first photo to get started!</p>
        </div>
      ) : (
        // Photo grid
        <div className="photo-grid">
          {photos.map((photo, index) => (
            <div
              key={photo._id}
              className="photo-card"
              onClick={() => openLightbox(index)}>
              <div className="photo-image-container">
                <img src={photo.blobUrl} alt={photo.title} loading="lazy" />
                <div className="photo-overlay">
                  <button
                    className="delete-btn"
                    onClick={(e) => handleDelete(photo._id, e)}
                    disabled={deletingId === photo._id}
                    aria-label="Delete photo">
                    {deletingId === photo._id ? "..." : "🗑️"}
                  </button>
                </div>
              </div>
              <div className="photo-info">
                <h3>{photo.title}</h3>
                {photo.description && <p>{photo.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox with navigation */}
      {currentPhoto && (
        <div className="lightbox" onClick={closeLightbox}>
          {/* Close button */}
          <button
            className="lightbox-close"
            onClick={closeLightbox}
            aria-label="Close lightbox">
            ✕
          </button>

          {/* Previous button */}
          {photos.length > 1 && (
            <button
              className="lightbox-nav lightbox-prev"
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              aria-label="Previous photo">
              ‹
            </button>
          )}

          {/* Photo content */}
          <div
            className="lightbox-content"
            onClick={(e) => e.stopPropagation()}>
            <img src={currentPhoto.blobUrl} alt={currentPhoto.title} />
            <div className="lightbox-info">
              <h2>{currentPhoto.title}</h2>
              {currentPhoto.description && <p>{currentPhoto.description}</p>}
              <span className="photo-counter">
                {currentPhotoIndex + 1} / {photos.length}
              </span>
            </div>
          </div>

          {/* Next button */}
          {photos.length > 1 && (
            <button
              className="lightbox-nav lightbox-next"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              aria-label="Next photo">
              ›
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default GalleryPage;
