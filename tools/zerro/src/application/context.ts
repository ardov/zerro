import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

import { ToolError } from './output'

export type TEndpoint = 'ru' | 'app'

export type TToolContext = {
  now: () => number
  env: NodeJS.ProcessEnv
  statePath: string
  endpoint: TEndpoint
  endpointExplicit: boolean
}

export function createToolContext(
  env: NodeJS.ProcessEnv = process.env,
  now: () => number = Date.now
): TToolContext {
  const endpointValue = env.ZERRO_ENDPOINT
  if (
    endpointValue !== undefined &&
    endpointValue !== 'ru' &&
    endpointValue !== 'app'
  )
    throw new ToolError(
      'startup',
      'none',
      'INVALID_ENDPOINT',
      'ZERRO_ENDPOINT must be "ru" or "app"',
      2
    )

  return {
    now,
    env,
    statePath: resolve(
      env.ZERRO_STATE_PATH ?? join(homedir(), '.zerro', 'state-v1.json')
    ),
    endpoint: endpointValue ?? 'ru',
    endpointExplicit: endpointValue !== undefined,
  }
}
