import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import mdx from '@mdx-js/rollup'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tsconfigPaths(), react(), mdx()],
  build: {
    outDir: 'build',
  },
  envPrefix: 'REACT_APP_',
  define: {
    APP_VERSION: JSON.stringify(process.env.npm_package_version),
  },
})
