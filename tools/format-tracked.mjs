import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'

const mode = process.argv[2]

if (mode !== '--check' && mode !== '--write') {
  console.error('Usage: node tools/format-tracked.mjs --check|--write')
  process.exit(2)
}

const tracked = spawnSync('git', ['ls-files', '-z'], { encoding: 'utf8' })

if (tracked.error) throw tracked.error
if (tracked.status !== 0) {
  process.stderr.write(tracked.stderr)
  process.exit(tracked.status ?? 1)
}

const files = tracked.stdout.split('\0').filter(existsSync)
if (files.length === 0) process.exit(0)

const prettier = spawnSync(
  'prettier',
  [
    mode,
    '--ignore-unknown',
    '--ignore-path',
    '.prettierignore',
    '--cache',
    '--cache-location',
    '.cache/prettier',
    '--cache-strategy',
    'content',
    '--',
    ...files,
  ],
  { stdio: 'inherit' }
)

if (prettier.error) throw prettier.error
process.exit(prettier.status ?? 1)
