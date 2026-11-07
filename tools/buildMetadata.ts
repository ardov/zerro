import { execFileSync } from 'node:child_process'
import type { Plugin } from 'vite'
import pkg from '../package.json' with { type: 'json' }

/** Stamp every HTML entry with the same release without changing JS asset hashes. */
export function buildMetadata(): Plugin {
  let metadata: Record<string, string>
  return {
    name: 'zerro-build-metadata',
    configResolved({ root, command }) {
      const { VERCEL_ENV, VERCEL_GIT_COMMIT_REF, VERCEL_GIT_COMMIT_SHA } =
        process.env
      const commit = VERCEL_GIT_COMMIT_SHA || readGitHead(root)
      const version =
        command === 'build' &&
        VERCEL_ENV === 'production' &&
        VERCEL_GIT_COMMIT_REF === 'master'
          ? productionVersion(root, commit)
          : pkg.version
      metadata = {
        'zerro-version': version,
        'zerro-release': `${version}+${commit.slice(0, 7) || 'unknown'}`,
        'zerro-build-date': new Date().toISOString(),
      }
    },
    transformIndexHtml() {
      return Object.entries(metadata).map(([name, content]) => ({
        tag: 'meta',
        attrs: { name, content },
      }))
    },
  }
}

function git(root: string, ...args: string[]) {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
}

function readGitHead(root: string) {
  try {
    return git(root, 'rev-parse', 'HEAD')
  } catch {
    return ''
  }
}

function productionVersion(root: string, commit: string) {
  const { VERCEL_GIT_REPO_OWNER: owner, VERCEL_GIT_REPO_SLUG: repo } =
    process.env
  if (!owner || !repo || !commit) {
    throw new Error(
      'Missing Vercel Git repository or commit for release version'
    )
  }
  const shallow = git(root, 'rev-parse', '--is-shallow-repository') === 'true'
  git(
    root,
    'fetch',
    ...(shallow ? ['--unshallow'] : []),
    '--tags',
    `https://github.com/${owner}/${repo}.git`,
    commit
  )

  // Git's --match accepts globs. Pass only exact release tag names to it.
  const tags = git(root, 'tag', '--list', 'v*.*.0')
    .split('\n')
    .filter(tag => /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.0$/.test(tag))
  if (!tags.length) {
    throw new Error(
      'Tag a master commit with vMAJOR.MINOR.0 to set the release version'
    )
  }
  const [tag, patch] = git(
    root,
    'describe',
    '--tags',
    '--first-parent',
    '--long',
    ...tags.flatMap(tag => ['--match', tag]),
    commit
  ).split('-')
  const [major, minor] = tag.slice(1).split('.')
  return `${major}.${minor}.${patch}`
}
