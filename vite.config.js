import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The dev proxy keeps API calls same-origin so the httpOnly refresh cookie works without CORS tweaks
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } } },
});
