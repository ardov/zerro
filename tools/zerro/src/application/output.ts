export type TEffect = 'none' | 'local' | 'remote'

export type TMeta = {
  observedAt: string
  baseServerTimestampMs: number
  stateRevision: string
  pendingCommandCount: number
  balancePendingCanonicalSync: boolean
}

export type TWarning = {
  code: string
  message: string
  entityIds?: Array<string | number>
}

export class ToolError extends Error {
  constructor(
    readonly command: string,
    readonly effect: TEffect,
    readonly code: string,
    message: string,
    readonly exitCode: number,
    readonly details?: Record<
      string,
      string | number | boolean | null | Array<string | number>
    >,
    readonly outcome: 'not_applied' | 'unknown' = 'not_applied',
    readonly retryable = false
  ) {
    super(message)
  }
}

export function success<T>(
  command: string,
  effect: TEffect,
  meta: TMeta,
  data: T,
  warnings?: TWarning[]
) {
  return {
    schemaVersion: 1 as const,
    ok: true as const,
    command,
    effect,
    meta,
    data,
    ...(warnings?.length ? { warnings } : {}),
  }
}

export function failure(error: ToolError) {
  return {
    schemaVersion: 1 as const,
    ok: false as const,
    command: error.command,
    effect: error.effect,
    error: {
      code: error.code,
      message: error.message,
      outcome: error.outcome,
      retryable: error.retryable,
      ...(error.details ? { details: error.details } : {}),
    },
  }
}
