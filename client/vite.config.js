import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest', // Tells Vite to use your custom sw.js
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectRegister: 'auto', // Vite will handle the registration for us now
      devOptions: {
        enabled: true, // Allows you to test the PWA installation on localhost
        type: 'module',
      },
      manifest: {
        name: 'MoBoxd',
        short_name: 'MoBoxd',
        description: 'Share and review your moments.',
        theme_color: '#1A1A21',
        background_color: '#1A1A21',
        display: 'standalone', // This hides the browser UI (URL bar)
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});