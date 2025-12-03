import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode (development, production)
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],

    // Development server config
    server: {
      port: 5173,
      // Proxy API requests to backend during development
      proxy: {
        "/api": {
          target: env.VITE_API_URL || "http://localhost:5000",
          changeOrigin: true,
          secure: false,
        },
      },
    },

    // Preview server (for testing production build locally)
    preview: {
      port: 4173,
    },

    // Build optimizations
    build: {
      // Output directory
      outDir: "dist",

      // Generate sourcemaps for debugging (disable in production if needed)
      sourcemap: mode !== "production",

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
  };
});
