import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — cached separately, rarely changes
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // UI icons library — large file, cached separately
          'vendor-icons': ['lucide-react'],
          // HTTP client — small but good to isolate
          'vendor-http': ['axios'],
        },
      },
    },
    // Warn when chunk exceeds 500kb (down from Vite's 1mb default)
    chunkSizeWarningLimit: 500,
  },
})
