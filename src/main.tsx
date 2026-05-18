import './styles/tokens.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { applyTheme, loadTheme } from '@/lib/theme'
import { queryClient } from '@/lib/queryClient'
import App from './App.tsx'

// Apply theme from localStorage before React renders (no flash)
const { palette, dark } = loadTheme()
applyTheme(palette, dark)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
