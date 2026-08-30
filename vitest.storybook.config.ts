import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.storybook.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      projects: ['light', 'dark'].map(theme => ({
        extends: true,
        plugins: [
          storybookTest({
            configDir: '.storybook',
            initialGlobals: { theme },
          }),
        ],
        test: {
          name: `storybook-${theme}`,
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
          setupFiles: ['./.storybook/vitest.setup.ts'],
        },
      })),
    },
  })
)
