import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import mdx from '@mdx-js/rollup'
import { VitePWA } from 'vite-plugin-pwa'
import { pageDocuments } from './tools/pageDocuments'
import { buildDefines } from './buildDefines'

export default defineConfig({
  appType: 'mpa',
  plugins: [
    react(),
    tailwindcss(),
    mdx(),
    pageDocuments(),
    VitePWA({
      manifest: false,
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'service-worker.ts',
      injectManifest: {
        rollupFormat: 'iife',
        globIgnores: ['404.html'],
        // Account marks are separate assets but must work with offline accounts.
        globPatterns: [
          '**/*.{js,wasm,css,html}',
          'assets/ic_bank_*.svg',
          'manifest.json',
        ],
        maximumFileSizeToCacheInBytes: 3_000_000,
      },
    }),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    outDir: 'dist',
    rolldownOptions: { input: ['index.html', '404.html'] },
    sourcemap: true,
  },
  envPrefix: 'REACT_APP_',
  define: buildDefines(),
})
