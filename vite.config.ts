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
    VitePWA({ registerType: 'autoUpdate', filename: 'service-worker.js' }),
  ],
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      // TODO: Remove when this issue fixed https://github.com/vitejs/vite/issues/15012
      onwarn(warning, defaultHandler) {
        if (warning.code === 'SOURCEMAP_ERROR') return
        defaultHandler(warning)
      },
    },
  },
  envPrefix: 'REACT_APP_',
  define: {
    APP_VERSION: JSON.stringify(process.env.npm_package_version),
  },
})
