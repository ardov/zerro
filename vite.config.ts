import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import mdx from '@mdx-js/rollup'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tsconfigPaths(),
    react(),
    mdx(),
    VitePWA({
      registerType: 'autoUpdate',
      filename: 'service-worker.js',
      workbox: {
        // Increase the default 2,097,152 (2MiB) limit
        maximumFileSizeToCacheInBytes: 3_000_000,
      },
    }),
  ],
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  envPrefix: 'REACT_APP_',
  define: {
    APP_VERSION: JSON.stringify(process.env.npm_package_version),
  },
  test: {
    globals: true,
    environment: 'happy-dom',
  },
})
