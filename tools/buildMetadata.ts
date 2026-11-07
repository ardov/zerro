import { execSync } from 'node:child_process'
import type { Plugin } from 'vite'
import pkg from '../package.json' with { type: 'json' }

/** Stamp every HTML entry with the same release without changing JS asset hashes. */
export function buildMetadata(): Plugin {
  const metadata = {
    'zerro-version': pkg.version,
    'zerro-release': `${pkg.version}+${buildCommit()}`,
    'zerro-build-date': new Date().toISOString(),
  }
  return {
    name: 'zerro-build-metadata',
    transformIndexHtml() {
      return Object.entries(metadata).map(([name, content]) => ({
        tag: 'meta',
        attrs: { name, content },
      }))
    },
  }
}

/** Vercel builds without the repository's history and names the commit in an
 * environment variable instead; a local build asks git. */
function buildCommit() {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA || readGitHead()
  return sha ? sha.slice(0, 7) : 'unknown'
}

function readGitHead() {
  try {
    return execSync('git rev-parse HEAD', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim()
  } catch {
    return ''
  }
}
