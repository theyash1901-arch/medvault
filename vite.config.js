import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react/') || id.includes('react-dom/') || id.includes('react-router-dom/')) return 'react_vendor';
            if (id.includes('@supabase/')) return 'supabase_vendor';
            if (id.includes('html5-qrcode') || id.includes('react-qr-')) return 'qr_vendor';
            if (id.includes('react-icons') || id.includes('lucide-react')) return 'icons_vendor';
            if (id.includes('@google/')) return 'ai_vendor';
            return 'vendor';
          }
        }
      }
    }
  }
})
