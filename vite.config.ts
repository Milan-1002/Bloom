import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      strategies: 'generateSW',
      includeAssets: [
        'favicon.svg', 'favicon.ico',
        'apple-touch-icon-180x180.png',
        'pwa-64x64.png', 'pwa-72x72.png', 'pwa-96x96.png',
        'pwa-128x128.png', 'pwa-144x144.png', 'pwa-152x152.png',
        'pwa-192x192.png', 'pwa-384x384.png', 'pwa-512x512.png',
        'maskable-icon-512x512.png',
      ],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 100, maxAgeSeconds: 3600 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'Bloom — PCOS Nutrition',
        short_name: 'Bloom',
        description: 'Your PCOS-aware nutrition companion',
        theme_color: '#1F3A4D',
        background_color: '#EEF2F5',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/pwa-64x64.png',             sizes: '64x64',   type: 'image/png' },
          { src: '/pwa-72x72.png',             sizes: '72x72',   type: 'image/png' },
          { src: '/pwa-96x96.png',             sizes: '96x96',   type: 'image/png' },
          { src: '/pwa-128x128.png',           sizes: '128x128', type: 'image/png' },
          { src: '/pwa-144x144.png',           sizes: '144x144', type: 'image/png' },
          { src: '/pwa-152x152.png',           sizes: '152x152', type: 'image/png' },
          { src: '/pwa-192x192.png',           sizes: '192x192', type: 'image/png' },
          { src: '/pwa-384x384.png',           sizes: '384x384', type: 'image/png' },
          { src: '/pwa-512x512.png',           sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
