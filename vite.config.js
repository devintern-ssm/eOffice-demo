import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    allowedHosts: ['dc7bd3e84e61.ngrok-free.app'] // Add this line to allow the ngrok host
  }
})
