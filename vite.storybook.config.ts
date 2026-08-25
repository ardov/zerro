import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

const root = path.dirname(fileURLToPath(import.meta.url))

/**
 * Vite settings shared by Storybook without the app PWA/service worker.
 *
 * The aliases repeat `tsconfig.json` paths on purpose: files under
 * `.storybook/` resolve against `tsconfig.node.json`, which has no `paths`,
 * so `tsconfigPaths` alone cannot resolve their layer imports.
 */
export default defineConfig({
  plugins: [tailwindcss()],
  optimizeDeps: {
    include: ['clsx'],
  },
  resolve: {
    tsconfigPaths: true,
    alias: {
      '@': path.resolve(root, 'src'),
      '1-app': path.resolve(root, 'src/1-app'),
      '2-pages': path.resolve(root, 'src/2-pages'),
      '3-widgets': path.resolve(root, 'src/3-widgets'),
      '4-features': path.resolve(root, 'src/4-features'),
      '6-shared': path.resolve(root, 'src/6-shared'),
      store: path.resolve(root, 'src/store'),
      'zerro-core': path.resolve(root, 'src/zerro-core'),
      stories: path.resolve(root, 'stories'),
    },
  },
  define: {
    APP_VERSION: JSON.stringify(process.env.npm_package_version),
  },
})
