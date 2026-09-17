import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
// Netlify exposes the deployed commit as COMMIT_REF; locally we stamp 'local'.
const build = {
  time: new Date().toISOString(),
  commit: (process.env.COMMIT_REF || process.env.GITHUB_SHA || 'local').slice(0, 7),
}

export default defineConfig({
  define: { __APP_BUILD__: JSON.stringify(build) },
  plugins: [
    react(),
    tailwindcss(),
    // Installable, offline-tolerant app shell: everything the client needs is
    // precached, the API is never cached except the event content, and a
    // new deploy takes over on the next visit.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Skattjakten · Gröna Lund',
        short_name: 'Skattjakten',
        description: 'Lagbaserad skattjakt runt Gröna Lund.',
        lang: 'sv',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#BFE3C8',
        theme_color: '#0E4A2B',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpeg,json,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallbackDenylist: [/^\/api\//, /^\/\.netlify\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname === '/api/event',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'event', expiration: { maxEntries: 2, maxAgeSeconds: 7 * 24 * 3600 } },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: { cacheName: 'fonts', expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 3600 } },
          },
        ],
      },
    }),
  ],
  // MapLibre's worker is loaded as a module worker (see VectorMap.jsx).
  worker: { format: 'es' },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
