/** The host owns HTTP, persistence, and presentation; Core owns shared retry and repacking rules. */
import type { TDataStore, TNormalizedPatch } from '../../domain/zenmoney'
import type { TCommand } from '../materialization'
import {
  acceptPushChunk,
  shrinkPushChunk,
  type TAcceptedPushChunk,
  type TPreparedPush,
  type TPushProgressRow,
} from './pushRun'

export const DEFAULT_PUSH_RETRY_POLICY = {
  maxAttempts: 3,
  firstDelayMs: 1000,
} as const

export type TPushRetryPolicy = {
  maxAttempts?: number
  firstDelayMs?: number
}

export type TPushSendResult =
  | { ok: true; patch: TNormalizedPatch }
  | {
      ok: false
      message: string
      status?: number
      retryAfterMs?: number
      /** Override status-based policy for transport failures with no usable HTTP response. */
      retryable?: boolean
      cause?: unknown
    }

export type TPushCommitResult = { ok: true } | { ok: false; message: string }

export type TPushEvent =
  | { type: 'sending'; progress: TPushProgressRow[] }
  | {
      type: 'waiting'
      progress: TPushProgressRow[]
      retryAt: number
      message: string
      status?: number
    }
  | {
      type: 'stopped'
      progress: TPushProgressRow[]
      message: string
      status?: number
    }
  | { type: 'done'; progress: TPushProgressRow[] }

export type TPushDriverPorts = {
  /** Performs one request. Never throws: a failure is a result. */
  send: (request: TNormalizedPatch) => Promise<TPushSendResult>
  /** Failure folding in an accepted chunk ends the run without retry: the server already has it. */
  commit: (chunk: {
    prepared: TPreparedPush
    accepted: TAcceptedPushChunk
    canonicalPatch: TNormalizedPatch
  }) => Promise<TPushCommitResult> | TPushCommitResult
  readReplica: () => {
    base: TDataStore
    outbox: readonly TCommand[]
    redo?: readonly TCommand[]
  }
  sleep: (milliseconds: number) => Promise<void>
  now: () => number
  report?: (event: TPushEvent) => void
  policy?: TPushRetryPolicy
}

export type TPushOutcome =
  | { kind: 'done' }
  | {
      kind: 'stopped'
      progress: TPushProgressRow[]
      message: string
      status?: number
      /** Carry the byte limit reduced by HTTP 413 into the next run. */
      maxBytes: number
      multiChunk: boolean
      /** Zero accepted chunks in a single-request run means that the outbox is still untouched. */
      acceptedChunks: number
      itemTooLarge?: boolean
      cause?: unknown
    }
  | { kind: 'abandoned'; progress: TPushProgressRow[]; message: string }

export function isRetryablePushStatus(status: number | undefined): boolean {
  return status === undefined || status === 429 || status >= 500
}

export async function drivePush(
  initial: TPreparedPush,
  ports: TPushDriverPorts
): Promise<TPushOutcome> {
  const maxAttempts =
    ports.policy?.maxAttempts ?? DEFAULT_PUSH_RETRY_POLICY.maxAttempts
  const firstDelayMs =
    ports.policy?.firstDelayMs ?? DEFAULT_PUSH_RETRY_POLICY.firstDelayMs
  const report = (event: TPushEvent) => ports.report?.(event)

  let prepared = initial
  let retries = 0
  let acceptedChunks = 0

  while (true) {
    const response = await ports.send(prepared.request)

    if (response.ok) {
      let accepted: TAcceptedPushChunk
      try {
        accepted = acceptPushChunk(
          ports.readReplica(),
          prepared,
          response.patch
        )
      } catch (error) {
        // The server accepted this chunk but the client cannot fold it in.
        // Offering a retry would resend work that is already durable there.
        return {
          kind: 'abandoned',
          progress: prepared.progress,
          message: errorMessage(error),
        }
      }

      // Retire at least one item per accepted chunk so a mismatched receipt cannot resend the same request indefinitely.
      if (
        accepted.next &&
        remainingItems(accepted.progress) >= remainingItems(prepared.progress)
      ) {
        return {
          kind: 'abandoned',
          progress: accepted.progress,
          message: 'Accepted push chunk retired no items',
        }
      }
      acceptedChunks += 1

      const committed = await ports.commit({
        prepared,
        accepted,
        canonicalPatch: response.patch,
      })
      if (!committed.ok) {
        return {
          kind: 'abandoned',
          progress: accepted.progress,
          message: committed.message,
        }
      }

      if (!accepted.next) {
        report({ type: 'done', progress: accepted.progress })
        return { kind: 'done' }
      }
      prepared = accepted.next
      retries = 0
      report({ type: 'sending', progress: accepted.progress })
      continue
    }

    if (response.status === 413) {
      const repacked = shrinkPushChunk(
        { base: ports.readReplica().base },
        prepared
      )
      if (!repacked) {
        report({
          type: 'stopped',
          progress: prepared.progress,
          message: response.message,
          status: response.status,
        })
        return {
          kind: 'stopped',
          progress: prepared.progress,
          message: response.message,
          status: response.status,
          maxBytes: prepared.run.maxBytes,
          multiChunk: prepared.run.multiChunk,
          acceptedChunks,
          itemTooLarge: true,
          cause: response.cause,
        }
      }
      prepared = repacked
      retries = 0
      report({ type: 'sending', progress: prepared.progress })
      continue
    }

    const retryable =
      response.retryable ?? isRetryablePushStatus(response.status)
    if (retryable && retries < maxAttempts) {
      const delay = response.retryAfterMs ?? firstDelayMs * 2 ** retries
      retries += 1
      report({
        type: 'waiting',
        progress: prepared.progress,
        retryAt: ports.now() + delay,
        message: response.message,
        status: response.status,
      })
      await ports.sleep(delay)
      report({ type: 'sending', progress: prepared.progress })
      continue
    }

    report({
      type: 'stopped',
      progress: prepared.progress,
      message: response.message,
      status: response.status,
    })
    return {
      kind: 'stopped',
      progress: prepared.progress,
      message: response.message,
      status: response.status,
      maxBytes: prepared.run.maxBytes,
      multiChunk: prepared.run.multiChunk,
      acceptedChunks,
      cause: response.cause,
    }
  }
}

function remainingItems(progress: readonly TPushProgressRow[]): number {
  return progress.reduce((sum, row) => sum + row.total - row.confirmed, 0)
}

function errorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.slice(0, 500) || 'Unknown push failure'
}
