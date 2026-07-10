import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Tauri needs a fixed port and fails if it is taken.
  clearScreen: false,
  server: {
    port: 6767,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      output: {
        // Keep rarely-changing vendor code in its own long-cacheable chunk.
        manualChunks(id: string) {
          if (id.includes("node_modules") && /[\\/](react|react-dom|scheduler|@tanstack[\\/]react-query|zustand)[\\/]/.test(id)) {
            return "vendor";
          }
        },
      },
    },
  },
})
