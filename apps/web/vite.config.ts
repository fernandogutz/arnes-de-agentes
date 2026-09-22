/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// La web habla con /api/... y Vite lo reenvía a la API local (puerto 3001).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
  build: {
    // Three.js + drei pesan ~1.1 MB minificados; van en un chunk aparte que solo se carga con las escenas 3D.
    chunkSizeWarningLimit: 1300,
    rollupOptions: {
      output: {
        // Three.js va aparte para que la app base cargue rápido.
        manualChunks: {
          tres: ['three', '@react-three/fiber', '@react-three/drei'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
})
