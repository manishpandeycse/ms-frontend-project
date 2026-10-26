import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The dev proxy keeps API calls same-origin so the httpOnly refresh cookie works without CORS tweaks
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': { target: 'https://ms-backend-capstone-project.onrender.com/', changeOrigin: true } } },
});
