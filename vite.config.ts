import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import mdx from '@mdx-js/rollup'
import { VitePWA } from 'vite-plugin-pwa'
import { pageDocuments } from './tools/pageDocuments'
import { buildMetadata } from './tools/buildMetadata'

export default defineConfig({
  appType: 'mpa',
  plugins: [
    react(),
    tailwindcss(),
    mdx(),
    buildMetadata(),
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
        // Install the complete app, including assets on screens not visited yet.
        globPatterns: [
          '**/*.{js,wasm,css,html,svg,png,jpg,jpeg,webp,avif,gif,ico,woff,woff2,ttf,otf}',
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
    rolldownOptions: {
      input: ['index.html', '404.html'],
      output: {
        codeSplitting: {
          groups: [
            { name: 'bank-icons', test: '/zenmoney-assets/bankIcons.ts' },
            { name: 'category-icons', test: '/zenmoney-assets/index.ts' },
          ],
        },
      },
    },
    sourcemap: true,
  },
  envPrefix: 'REACT_APP_',
})
