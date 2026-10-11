import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite + React, with Vitest unit-test config (jsdom so we can test lib + hooks).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{js,jsx}'],
  },
})
