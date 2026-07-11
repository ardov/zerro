import { describe, expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

describe('core-next package consumer', () => {
  it('generates declarations and type-checks an external consumer', () => {
    const result = spawnSync(
      process.execPath,
      [resolve(repoRoot, 'scripts/check-core-next-package.mjs')],
      { cwd: repoRoot, encoding: 'utf8' }
    )

    expect(result.stderr).toBe('')
    expect(result.status, result.stdout + result.stderr).toBe(0)
  })
})
