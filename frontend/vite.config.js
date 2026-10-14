import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/predict': 'http://localhost:5000',
      '/report': 'http://localhost:5000',
      '/analytics': 'http://localhost:5000',
      '/export': 'http://localhost:5000',
      '/export-summary': 'http://localhost:5000',
      '/api': 'http://localhost:5000'
    }
  }
})
