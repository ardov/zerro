// @vitest-environment node
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'vite'
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest'
import pkg from '../package.json' with { type: 'json' }
import { buildMetadata } from './buildMetadata'

const temp = mkdtempSync(join(tmpdir(), 'zerro-build-version-'))
const source = join(temp, 'source')
const remote = pathToFileURL(source).href
const github = 'https://github.com/example/version-test.git'
let merge: string
let nextMinor: string

function git(cwd: string, ...args: string[]) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: 'pipe',
  }).trim()
}

beforeAll(() => {
  git(temp, 'init', '-b', 'master', source)
  git(source, 'config', 'user.name', 'Version test')
  git(source, 'config', 'user.email', 'test@example.invalid')
  git(source, 'config', 'commit.gpgSign', 'false')
  git(source, 'config', 'tag.gpgSign', 'false')
  writeFileSync(join(source, 'index.html'), '<html><head></head></html>')
  git(source, 'add', 'index.html')
  git(source, 'commit', '-m', 'Start series')
  git(source, 'tag', '-a', 'v2.3.0', '-m', 'v2.3.0')
  git(source, 'switch', '-c', 'beta')
  git(source, 'commit', '--allow-empty', '-m', 'Side branch')
  git(source, 'tag', 'v8.0.0')
  git(source, 'switch', 'master')
  git(source, 'commit', '--allow-empty', '-m', 'Mainline commit')
  git(source, 'merge', '--no-ff', 'beta', '-m', 'Merge beta')
  merge = git(source, 'rev-parse', 'HEAD')
  git(source, 'tag', 'v2.99-rc.0')
  git(source, 'commit', '--allow-empty', '-m', 'Next minor')
  git(source, 'tag', 'v2.4.0')
  nextMinor = git(source, 'rev-parse', 'HEAD')
})

afterEach(() => vi.unstubAllEnvs())
afterAll(() => rmSync(temp, { recursive: true, force: true }))

function shallowClone(name: string) {
  const root = join(temp, name)
  git(temp, 'clone', '--depth=1', '--no-tags', remote, root)
  git(root, 'config', `url.${remote}.insteadOf`, github)
  return root
}

async function checkBuild(root: string, commit: string, version: string) {
  vi.stubEnv('VERCEL_GIT_COMMIT_SHA', commit)
  const result = await build({
    root,
    configFile: false,
    logLevel: 'silent',
    plugins: [buildMetadata()],
    build: { write: false },
  })
  const bundle = Array.isArray(result) ? result[0] : result
  if (!('output' in bundle)) throw new Error('Expected a completed build')
  const html = bundle.output.find(file => file.fileName === 'index.html')
  expect(html).toMatchObject({
    type: 'asset',
    source: expect.stringContaining(
      `name="zerro-version" content="${version}"`
    ),
  })
  expect(html).toMatchObject({
    source: expect.stringContaining(
      `name="zerro-release" content="${version}+${commit.slice(0, 7)}"`
    ),
  })
}

it('versions the deployed SHA along the first parents, including after a shallow clone', async () => {
  const root = shallowClone('production')
  vi.stubEnv('VERCEL_ENV', 'production')
  vi.stubEnv('VERCEL_GIT_COMMIT_REF', 'master')
  vi.stubEnv('VERCEL_GIT_REPO_OWNER', 'example')
  vi.stubEnv('VERCEL_GIT_REPO_SLUG', 'version-test')
  await checkBuild(root, merge, '2.3.2')
  await checkBuild(root, merge, '2.3.2')
  await checkBuild(root, nextMinor, '2.4.0')
})

it.each([
  ['preview', 'master'],
  ['production', 'beta'],
  [undefined, undefined],
])(
  'uses package metadata offline for %s on %s',
  async (environment, branch) => {
    const root = shallowClone(`${environment}-${branch}`)
    vi.stubEnv('VERCEL_ENV', environment)
    vi.stubEnv('VERCEL_GIT_COMMIT_REF', branch)
    await checkBuild(root, nextMinor, pkg.version)
    expect(git(root, 'rev-parse', '--is-shallow-repository')).toBe('true')
  }
)
