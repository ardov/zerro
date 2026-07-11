import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const tsc = join(repoRoot, 'node_modules/typescript/bin/tsc')
const declarationConfig = join(
  repoRoot,
  'scripts/core-next-package/tsconfig.declarations.json'
)
const consumerSource = join(
  repoRoot,
  'scripts/core-next-package/consumer.ts'
)
const workDir = await mkdtemp(join(tmpdir(), 'zerro-core-next-package-'))

try {
  const declarationsDir = join(workDir, 'declarations')
  runTsc(['-p', declarationConfig, '--outDir', declarationsDir])

  const packageDir = join(workDir, 'node_modules/core-next')
  await mkdir(packageDir, { recursive: true })
  await cp(join(declarationsDir, 'core-next'), packageDir, { recursive: true })
  await writeFile(
    join(packageDir, 'package.json'),
    JSON.stringify({ name: 'core-next', private: true, types: 'index.d.ts' })
  )

  await writeFile(
    join(workDir, 'consumer.ts'),
    await readFile(consumerSource, 'utf8')
  )
  await writeFile(
    join(workDir, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        strict: true,
        noEmit: true,
        skipLibCheck: false,
        target: 'ESNext',
        module: 'ESNext',
        moduleResolution: 'Node',
      },
      files: ['consumer.ts'],
    })
  )

  runTsc(['-p', join(workDir, 'tsconfig.json')], workDir)
  console.log('Core Next declarations and external consumer check passed')
} finally {
  await rm(workDir, { recursive: true, force: true })
}

function runTsc(args, cwd = repoRoot) {
  const result = spawnSync(process.execPath, [tsc, ...args], {
    cwd,
    encoding: 'utf8',
  })
  if (result.status !== 0) {
    process.stderr.write(result.stdout)
    process.stderr.write(result.stderr)
    process.exitCode = result.status || 1
    throw new Error('TypeScript package check failed')
  }
}
