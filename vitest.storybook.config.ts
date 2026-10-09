import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.storybook.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // Unbounded browser workers contend for CPU and make timed transitions
      // both slower and flaky on high-core machines.
      maxWorkers: 2,
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
            provider: playwright({
              contextOptions: {
                ...(process.env.STORYBOOK_REDUCED_MOTION === '1'
                  ? { reducedMotion: 'reduce' as const }
                  : {}),
                ...(process.env.STORYBOOK_ANDROID === '1'
                  ? {
                      userAgent:
                        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
                    }
                  : {}),
              },
            }),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
          setupFiles: ['./.storybook/vitest.setup.ts'],
        },
      })),
    },
  })
)
