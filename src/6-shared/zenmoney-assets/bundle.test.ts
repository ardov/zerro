// @vitest-environment node
import { basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build, type Rollup } from 'vite'
import { expect, it } from 'vitest'

it('emits every category icon as a file rather than an inline data URL', async () => {
  const entry = fileURLToPath(new URL('./index.ts', import.meta.url))
  const result = (await build({
    configFile: false,
    logLevel: 'silent',
    build: { write: false, rollupOptions: { input: entry } },
  })) as Rollup.RollupOutput
  const categoryFiles = result.output.filter(
    file => file.type === 'asset' && /^a\d+_/.test(basename(file.fileName))
  )
  const code = result.output
    .filter((file): file is Rollup.OutputChunk => file.type === 'chunk')
    .map(chunk => chunk.code)
    .join('\n')

  expect(categoryFiles).toHaveLength(167)
  expect(code).not.toMatch(/data:image\/svg\+xml[^"'`]*%3csvg/)
}, 30_000)
