// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'TechERP',
        short_name: 'POS',
        description: 'A Progressive Web App for POS',
        theme_color: '#ffffff',
        icons: [
          {
            src: './images/img-1.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: './images/img-1.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    host: true,
    port: 3000
  }
});
