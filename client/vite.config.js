import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Development server config
  server: {
    port: 5173,
  },

  // Preview server (for testing production build locally)
  preview: {
    port: 4173,
  },

  // Build optimizations
  build: {
    // Output directory
    outDir: "dist",

    // Generate sourcemaps for debugging
    sourcemap: false,

    // Minification
    minify: "esbuild",

    // Chunk size warnings threshold (in KB)
    chunkSizeWarningLimit: 500,

    // Rollup options for code splitting
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunk for React
          vendor: ["react", "react-dom"],
          // Router chunk
          router: ["react-router-dom"],
        },
      },
    },
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom", "axios"],
  },
});
