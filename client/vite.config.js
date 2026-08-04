import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Automatically updates the app when you push new code
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'], // Any extra assets
      manifest: {
        name: 'MoBoxd',
        short_name: 'MoBoxd',
        description: 'Track and share your favorite moments and rankings.',
        theme_color: '#1A1A21', // Matches your dark UI background
        background_color: '#000000',
        display: 'standalone', // Makes it look like a native app (hides the browser URL bar)
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'public/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'public/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // Good for Android adaptive icons
          }
        ]
      }
    })
  ]
});