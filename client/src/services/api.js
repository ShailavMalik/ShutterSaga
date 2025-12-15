/**
 * API Service
 * Production-ready API client with automatic token handling,
 * request/response interceptors, and error management
 */

import axios from "axios";

/* ============================================
   Configuration
============================================ */

// API base URL - uses environment variable in production
// Default to production backend if no env variable is set
const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://shuttersaga-backend-eqfegxebavdwdqgf.centralindia-01.azurewebsites.net/api";

// Request timeout (30 seconds)
const REQUEST_TIMEOUT = 30000;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request Interceptor
 * Automatically attaches the auth token to every request
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor
 * Handles errors globally and manages token expiration
 */
api.interceptors.response.use(
  // Success - just return the response
  (response) => response,

  // Error handling
  (error) => {
    // Network error or timeout
    if (!error.response) {
      const message =
        error.code === "ECONNABORTED"
          ? "Request timed out. Please try again."
          : "Network error. Please check your connection.";
      return Promise.reject(new Error(message));
    }

    // Handle specific HTTP status codes
    const { status } = error.response;

    if (status === 401) {
      // Unauthorized - clear auth and redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Only redirect if not already on login page
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    if (status === 429) {
      // Rate limited
      error.response.data.message = "Too many requests. Please slow down.";
    }

    return Promise.reject(error);
  }
);

/* ============================================
   Authentication API
============================================ */
export const authAPI = {
  login: (email, password) => api.post("/auth/login", { email, password }),

  register: (username, email, password) =>
    api.post("/auth/register", { username, email, password }),

  googleLogin: (credential) => api.post("/auth/google", { credential }),

  getMe: () => api.get("/auth/me"),
  updateAvatar: (formData) =>
    api.post("/auth/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getStorageUsage: () => api.get("/auth/storage-usage"),
};

/* ============================================
   Photos API
============================================ */
export const photosAPI = {
  // Upload new photos (multipart form data)
  upload: (formData) =>
    api.post("/photos/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // Get all photos for current user
  getAll: () => api.get("/photos"),

  // Get photos for export with sizes
  getExport: () => api.get("/photos/export"),

  // Get a single photo by ID
  getOne: (id) => api.get(`/photos/${id}`),

  // Delete a photo
  delete: (id) => api.delete(`/photos/${id}`),

  // Update/edit a photo
  updatePhoto: (id, formData) =>
    api.post(`/photos/${id}/edit`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // Proxy endpoint to fetch image (bypasses CORS)
  getImageProxy: (id) =>
    api.get(`/photos/${id}/proxy`, {
      responseType: "blob",
    }),
};

export default api;
