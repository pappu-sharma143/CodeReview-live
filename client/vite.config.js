import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const apiTarget = 'http://localhost:5000'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ['three', 'react', 'react-dom'],
  },
  server: {
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
      '/socket.io': {
        target: apiTarget,
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
