import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * Adds the repository-local ZM_TOKEN only when a caller did not provide it
 * explicitly. This is deliberately a tiny parser, not shell evaluation:
 * `.env.local` can never execute code.
 */
export async function withLocalZmToken(
  env: NodeJS.ProcessEnv = process.env,
  cwd = process.cwd()
): Promise<NodeJS.ProcessEnv> {
  if (env.ZM_TOKEN) return env
  let source: string
  try {
    source = await readFile(join(cwd, '.env.local'), 'utf8')
  } catch {
    return env
  }
  const token = parseZmToken(source)
  return token ? { ...env, ZM_TOKEN: token } : env
}

export function parseZmToken(source: string): string | undefined {
  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?ZM_TOKEN\s*=\s*(.*?)\s*$/)
    if (!match) continue
    const value = unquote(match[1])
    if (value) return value
  }
  return undefined
}

function unquote(value: string): string {
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  )
    return value.slice(1, -1)
  return value
}
