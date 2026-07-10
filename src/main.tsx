import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import './index.css'
import "./theme/fonts.css"
import "./theme/tokens.css"
import App from './App.tsx'
import { useAppStore } from './state/appStore'
import { useThemeStore } from './state/themeStore'

const queryClient = new QueryClient({
  // Git data is cheap to recompute but each query spawns a git process; a short
  // staleTime dedupes bursts (e.g. rapid window-focus refetches) without making
  // the UI feel stale. Mutations explicitly invalidate what they change.
  defaultOptions: {
    queries: { staleTime: 5000, retry: false },
  },
});

// Dev-only: expose stores and the query client for manual verification in a
// plain browser (no Tauri backend).
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__appStore = useAppStore;
  (window as unknown as Record<string, unknown>).__themeStore = useThemeStore;
  (window as unknown as Record<string, unknown>).__qc = queryClient;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
