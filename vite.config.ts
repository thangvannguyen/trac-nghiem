import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// BASE_PATH: '/' cho Firebase Hosting (mặc định), '/trac-nghiem/' cho GitHub Pages (xem .github/workflows/pages.yml).
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          react: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
    chunkSizeWarningLimit: 900,
  },
});
