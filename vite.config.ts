import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { configDefaults } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Tauri needs a fixed port and fails if it is taken.
  clearScreen: false,
  server: {
    port: 6767,
    strictPort: true,
  },
  test: {
    // Component tests render into jsdom; pure-function tests are unaffected.
    environment: "jsdom",
    // .claude/ can hold sibling git worktrees (parallel agent sessions); without
    // this they'd be picked up as a second copy of the whole suite (doubling run
    // time and doubling any flake surface). Already gitignored for the same reason.
    exclude: [...configDefaults.exclude, ".claude/**"],
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
