// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Enable the server to be accessible externally
    port: 3000, // Specify a port number (optional)
  },
});
