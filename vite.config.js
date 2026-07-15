import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // GitHub Pages deploys to /<repo-name>/ — use env var or fallback to '/'
  base: process.env.VITE_BASE || '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'DataSense Local AI Workspace',
        short_name: 'DataSense',
        description: 'On-device AI workspace for data science students',
        theme_color: '#09090b',
        background_color: '#09090b',
        display: 'standalone',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,mjs,wasm}'],
        // Ensure Wasm and larger worker scripts can be cached offline
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024
      }
    })
  ],
}))
