import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    // /api/* is served by `vercel dev` on port 3000 (see `npm run dev:full`)
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
