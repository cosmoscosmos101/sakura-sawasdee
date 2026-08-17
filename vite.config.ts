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
        name: "Sakura & Sawasdee",
        short_name: "SakuraSawasdee",
        description: "Learn Japanese and Thai through a pastel pixel-art RPG",
        theme_color: "#FFF0F5",
        background_color: "#4A3F55",
        display: "standalone",
        orientation: "portrait",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{css,html,woff2}"],
        maximumFileSizeToCacheInBytes: 200 * 1024,
        runtimeCaching: [
          {
            urlPattern: /\.js$/,
            handler: "CacheFirst",
            options: { cacheName: "js-chunks", expiration: { maxEntries: 20 } },
          },
          {
            urlPattern: /\.(png|jpg|webp|ogg|mp3)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "assets",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
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
          howler:  ["howler"],
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
