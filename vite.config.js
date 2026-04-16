import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    minify: 'esbuild',
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split core React libraries
          react_vendor: ['react', 'react-dom', 'react-router-dom'],
          // Split Supabase SDK which is usually large
          supabase_vendor: ['@supabase/supabase-js'],
          // Split QR Code related dense libraries
          qr_vendor: ['@yudiel/react-qr-scanner', 'react-qr-reader', 'qrcode', 'html5-qrcode'],
          // Split icon sets
          icons_vendor: ['react-icons', 'lucide-react'],
          // Split heavy generative AI libraries
          ai_vendor: ['@google/generative-ai', '@google/genai']
        }
      }
    }
  }
})
