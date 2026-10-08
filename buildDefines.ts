import { execSync } from 'node:child_process'

/** What the build bakes into the app. The version is the one people see and is
 * bumped by hand; the date and commit tell one deploy from the next without
 * anyone touching it. Declared for the app in `typings/vite-env.d.ts`. */
export function buildDefines() {
  return {
    APP_VERSION: JSON.stringify(process.env.npm_package_version),
    APP_BUILD_DATE: JSON.stringify(new Date().toISOString()),
    APP_BUILD_COMMIT: JSON.stringify(buildCommit()),
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
