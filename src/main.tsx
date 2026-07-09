import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import './index.css'
import "./theme/fonts.css"
import "./theme/tokens.css"
import App from './App.tsx'
import { useAppStore } from './state/appStore'
import { useThemeStore } from './state/themeStore'

// Dev-only: expose stores for manual verification in a plain browser (no Tauri).
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__appStore = useAppStore;
  (window as unknown as Record<string, unknown>).__themeStore = useThemeStore;
}

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
