import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto", // Ensures the Service Worker is injected automatically
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
      manifest: {
        id: "/", // Unchanging ID required by PWABuilder
        name: "MoBoxd",
        short_name: "MoBoxd",
        description: "Track and share your favorite moments and rankings.",
        theme_color: "#1A1A21",
        background_color: "#000000",
        display: "standalone",
        orientation: "portrait", // Locks app to portrait mode
        dir: "ltr", // Left-to-right text direction
        categories: ["social", "entertainment"],
        icons: [
          {
            src: "/pwa-192x192.png", // Note the leading slash, NO 'public/'
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png", // Note the leading slash, NO 'public/'
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable", // PWABuilder loves maskable icons
          },
        ],
        screenshots: [
          {
            src: "/desktop-screenshot.png",
            sizes: "1920x1080",
            type: "image/png",
            form_factor: "wide",
          },
          {
            src: "/mobile-screenshot.png",
            sizes: "1080x1920",
            type: "image/png",
            form_factor: "narrow",
          },
        ],
        // Optional but recommended: Adds app shortcuts (like long-pressing an app icon on Android)
        shortcuts: [
          {
            name: "New Ranking",
            short_name: "Rank",
            description: "Create a new ranking lobby",
            url: "/activity", // Or whatever your route is for creating a ranking
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }],
          },
        ],
      },
    }),
  ],
});
