/**
 * Gallery Page
 * Displays user's photos in a grid with a lightbox viewer and navigation
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { photosAPI } from "../services/api";

function GalleryPage() {
  // Photos data
  const [photos, setPhotos] = useState([]); // Removed comments for clarity

  // UI states
  const [isLoading, setIsLoading] = useState(true); // Removed comments for clarity
  const [error, setError] = useState("");

  // Lightbox state - store index instead of photo object for easier navigation
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [sortBy, setSortBy] = useState("newest");
  const [isSlideshow, setIsSlideshow] = useState(false);

  const sortedPhotos = useMemo(() => {
    return [...photos].sort((a, b) => {
      if (sortBy === "newest")
        return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "oldest")
        return new Date(a.createdAt) - new Date(b.createdAt);
      return a.title.localeCompare(b.title);
    });
  }, [photos, sortBy]);

  // Lightbox navigation functions (defined with useCallback for useEffect dependency)
  const goToPrevious = useCallback(() => {
    setCurrentPhotoIndex((prev) =>
      prev === 0 ? sortedPhotos.length - 1 : prev - 1
    );
  }, [sortedPhotos.length]);

  const goToNext = useCallback(() => {
    setCurrentPhotoIndex((prev) =>
      prev === sortedPhotos.length - 1 ? 0 : prev + 1
    );
  }, [sortedPhotos.length]);

  const closeLightbox = useCallback(() => {
    setCurrentPhotoIndex(null);
  }, []);

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
        case " ":
          e.preventDefault();
          setIsSlideshow((prev) => !prev);
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPhotoIndex, goToPrevious, goToNext, closeLightbox]);

  // Slideshow auto-advance effect
  useEffect(() => {
    if (!isSlideshow || currentPhotoIndex === null) return;

    const interval = setInterval(() => {
      goToNext();
    }, 3000); // Advance every 3 seconds

    return () => clearInterval(interval);
  }, [isSlideshow, currentPhotoIndex, goToNext]);

  // Reset slideshow when closing lightbox
  useEffect(() => {
    if (currentPhotoIndex === null) {
      setIsSlideshow(false);
    }
  }, [currentPhotoIndex]);

  // Fetch all photos from the API
  async function loadPhotos() {
    try {
      setIsLoading(true);
      const response = await photosAPI.getAll();
      setPhotos(response.data.photos);
    } catch {
      setError("Failed to load your photos. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // Get current photo for lightbox
  const currentPhoto =
    currentPhotoIndex !== null ? sortedPhotos[currentPhotoIndex] : null;

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
    } catch {
      alert("Failed to delete photo. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  // Open lightbox
  function openLightbox(index) {
    setCurrentPhotoIndex(index);
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center py-20 text-gray-500">
          <div className="text-6xl mb-4 animate-[float_2s_ease-in-out_infinite]">
            📷
          </div>
          <div className="text-lg">Loading your photos...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center py-20 text-red-600 bg-red-50 rounded-2xl border border-red-200">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-20 sm:pb-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl bg-white/70 backdrop-blur-xl border border-gray-200 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
        <div>
          <h1 className="m-0 text-2xl sm:text-3xl font-bold bg-linear-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
            My Gallery
          </h1>
          <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">
            {photos.length} {photos.length === 1 ? "photo" : "photos"} in your
            collection
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 bg-gray-50 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-gray-200">
          <label
            htmlFor="sort"
            className="text-gray-600 font-medium text-xs sm:text-sm">
            Sort by
          </label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-200 bg-white cursor-pointer font-medium text-gray-700 text-sm focus:outline-none focus:border-purple-500">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="title">Title A-Z</option>
          </select>
        </div>
      </div>

      {/* Empty state */}
      {photos.length === 0 ? (
        <div className="text-center p-10 sm:p-20 bg-white/70 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-lg">
          <span className="text-5xl sm:text-7xl block mb-4 sm:mb-6 animate-[float_3s_ease-in-out_infinite]">
            📷
          </span>
          <h2 className="m-0 text-xl sm:text-2xl font-semibold text-gray-800">
            No photos yet
          </h2>
          <p className="text-gray-500 mt-2 sm:mt-3 text-sm sm:text-base">
            Upload your first photo to start your collection!
          </p>
        </div>
      ) : (
        // Photo grid - smaller cards for more photos per row
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {sortedPhotos.map((photo, index) => (
            <div
              key={photo._id}
              className="group bg-white rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border border-gray-200 shadow-sm hover:-translate-y-1 hover:shadow-lg hover:border-purple-300 animate-[cardEnter_.4s_ease-out_both]"
              style={{ animationDelay: `${index * 0.03}s` }}
              onClick={() => openLightbox(index)}>
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={photo.blobUrl}
                  alt={photo.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-white text-2xl sm:text-3xl">🔍</span>
                </div>
                <button
                  className="absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 backdrop-blur-sm text-gray-700 cursor-pointer transition-all duration-200 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white hover:scale-110 hover:cursor-pointer disabled:opacity-50 flex items-center justify-center shadow-md text-sm"
                  onClick={(e) => handleDelete(photo._id, e)}
                  disabled={deletingId === photo._id}
                  aria-label="Delete photo">
                  {deletingId === photo._id ? "..." : "🗑️"}
                </button>
              </div>
              <div className="p-2 sm:p-3">
                <h3 className="m-0 text-gray-800 text-sm font-medium truncate">
                  {photo.title}
                </h3>
                <span className="block mt-1 text-gray-400 text-xs">
                  📅{" "}
                  {new Date(photo.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox with navigation */}
      {currentPhoto && (
        <div
          className="fixed inset-0 bg-linear-to-br from-black/95 to-[#1e143c]/95 flex items-center justify-center z-[1000] p-5"
          onClick={closeLightbox}>
          {/* Header with controls */}
          <div className="absolute top-5 left-5 flex items-center gap-4 z-10">
            <button
              className="w-11 h-11 border-2 border-white/30 rounded-full bg-linear-to-br from-indigo-500/30 to-pink-400/20 text-white text-xl cursor-pointer transition-all backdrop-blur-md hover:from-indigo-500/50 hover:to-pink-400/40 hover:border-white/60 hover:scale-105"
              onClick={(e) => {
                e.stopPropagation();
                setIsSlideshow(!isSlideshow);
              }}
              aria-label={isSlideshow ? "Stop slideshow" : "Start slideshow"}
              title="Press Space to toggle slideshow">
              {isSlideshow ? "⏸" : "▶"}
            </button>
            <span className="text-white/70 text-sm font-medium">
              Press Space to toggle slideshow
            </span>
          </div>

          {/* Close button */}
          <button
            className="absolute top-5 right-5 w-11 h-11 border-2 border-white/30 rounded-full bg-linear-to-br from-[#f05d96]/30 to-[#ff7f50]/20 text-white text-2xl cursor-pointer transition-all z-10 backdrop-blur-md hover:from-[#f05d96]/50 hover:to-[#ff7f50]/40 hover:border-white/60 hover:scale-105"
            onClick={closeLightbox}
            aria-label="Close lightbox">
            ✕
          </button>

          {/* Previous button */}
          {photos.length > 1 && (
            <button
              className="absolute top-1/2 -translate-y-1/2 left-5 w-[50px] h-[50px] border-2 border-white/30 rounded-full bg-linear-to-br from-indigo-500/30 to-pink-400/20 text-white text-3xl cursor-pointer transition-all flex items-center justify-center z-10 backdrop-blur-md hover:from-indigo-500/50 hover:to-pink-400/40 hover:border-white/60 hover:scale-110"
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
            className="max-w-[90vw] max-h-[90vh] flex flex-col items-center animate-[slideUp_.3s_ease-out]"
            onClick={(e) => e.stopPropagation()}>
            <img
              src={currentPhoto.blobUrl}
              alt={currentPhoto.title}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
            <div className="text-center text-white mt-5">
              <h2 className="m-0 text-xl">{currentPhoto.title}</h2>
              {currentPhoto.description && (
                <p className="mt-2 text-gray-300">{currentPhoto.description}</p>
              )}
              <span className="block mt-4 text-gray-500 text-sm">
                {currentPhotoIndex + 1} / {photos.length}
              </span>
            </div>
          </div>

          {/* Next button */}
          {photos.length > 1 && (
            <button
              className="absolute top-1/2 -translate-y-1/2 right-5 w-[50px] h-[50px] border-2 border-white/30 rounded-full bg-linear-to-br from-indigo-500/30 to-pink-400/20 text-white text-3xl cursor-pointer transition-all flex items-center justify-center z-10 backdrop-blur-md hover:from-indigo-500/50 hover:to-pink-400/40 hover:border-white/60 hover:scale-110"
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
