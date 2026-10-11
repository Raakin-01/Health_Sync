import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite + React, with Vitest unit-test config (jsdom so we can test lib + hooks).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  // Pre-bundle recharts when the dev server starts, not on first visit to
  // /analytics. The analytics page is lazy-loaded, so without this Vite would
  // re-optimize deps *while* the browser is importing the lazy chunk, which can
  // abort the dynamic import ("Loading failed for the module").
  optimizeDeps: {
    include: ['recharts'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
  },
})
