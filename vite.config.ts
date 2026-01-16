import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.png", "manifest.json"],
      manifest: {
        name: "SysMed",
        short_name: "SysMed",
        description: "Your Medical Social Network",
        theme_color: "#006a4e",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "icon.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icon.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        runtimeCaching: [
          {
            // Cache Supabase Storage Images
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*$/,
            handler: "CacheFirst",
            options: {
              cacheName: "supabase-storage-images",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === "COMMONJS_VARIABLE_IN_ESM") return;
        warn(warning);
      },
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("react-router-dom")
            ) {
              return "vendor";
            }
            if (id.includes("@supabase")) {
              return "supabase";
            }
            if (id.includes("@tanstack")) {
              return "tanstack";
            }
            if (id.includes("dashjs")) {
              return "dashjs";
            }
            return "libs";
          }
        },
      },
    },
  },
});