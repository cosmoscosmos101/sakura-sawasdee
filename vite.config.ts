/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon-192.png", "icon-512.png", "favicon.ico"],
      manifest: {
        name: "Chrono Kotodama",
        short_name: "ChronoKotodama",
        description: "Learn Japanese through Chrono Trigger-style turn-based battles",
        theme_color: "#0d0d1a",
        background_color: "#0d0d1a",
        display: "standalone",
        orientation: "landscape",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      workbox: {
        // Use new cache names so old SW entries are evicted immediately
        globPatterns: ["**/*.{css,html,woff2}"],
        maximumFileSizeToCacheInBytes: 200 * 1024,
        runtimeCaching: [
          {
            urlPattern: /\.js$/,
            handler: "NetworkFirst",
            options: { cacheName: "ck-js-v2", expiration: { maxEntries: 20 } },
          },
          {
            urlPattern: /\.(png|jpg|webp|ogg|mp3|wav|ttf)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "ck-assets-v2",
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    open: true,
  },
  build: {
    target: "es2022",
    // Keep Phaser in its own chunk so the UI can paint before the engine loads.
    rollupOptions: {
      output: {
        manualChunks: {
          phaser:  ["phaser"],
          vendor:  ["framer-motion", "zustand", "dexie"],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "src/tests/**/*.spec.ts"],
  },
});
