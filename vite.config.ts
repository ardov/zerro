import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import mdx from '@mdx-js/rollup'
import { VitePWA } from 'vite-plugin-pwa'
import { buildDefines } from './buildDefines'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    mdx(),
    VitePWA({
      registerType: 'autoUpdate',
      filename: 'service-worker.js',
      workbox: {
        importScripts: ['favicon-cache-sw.js'],
        // Account marks are separate assets but must work with offline accounts.
        globPatterns: ['**/*.{js,wasm,css,html}', 'assets/ic_bank_*.svg'],
        // Increase the default 2,097,152 (2MiB) limit
        maximumFileSizeToCacheInBytes: 3_000_000,
      },
    }),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  envPrefix: 'REACT_APP_',
  define: buildDefines(),
})
