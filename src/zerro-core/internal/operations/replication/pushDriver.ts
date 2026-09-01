/**
 * Delivery of a Push run: send, apply, repack, retry, repeat.
 *
 * Transport belongs to the host — HTTP, persistence, presentation — but when
 * to retry, how long to wait and what a rejection means are properties of the
 * protocol, not of the browser or the CLI. Both drive their runs through this
 * one loop so the two cannot drift apart.
 */
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
      /** Absent when the request never received an answer at all. */
      status?: number
      retryAfterMs?: number
      /**
       * Overrides the status rule, for adapters whose failures are not all
       * HTTP — a transport that never reached the server, or a response that
       * arrived intact and cannot be understood.
       */
      retryable?: boolean
      /** Carried back untouched, so a host can rethrow its own error. */
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
  /**
   * Applies and durably records one accepted chunk. Returning a failure ends
   * the run without a retry offer: the server already accepted this chunk, so
   * resending it is the host's recovery to own, not the driver's. A host that
   * would rather fail loudly may throw instead; the exception reaches whoever
   * started the run.
   */
  commit: (chunk: {
    prepared: TPreparedPush
    accepted: TAcceptedPushChunk
    canonicalPatch: TNormalizedPatch
  }) => Promise<TPushCommitResult> | TPushCommitResult
  /** The replica as it stands now — after every chunk committed so far. */
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
  /** Delivery stopped with the remainder intact; retrying is meaningful. */
  | {
      kind: 'stopped'
      progress: TPushProgressRow[]
      message: string
      status?: number
      /**
       * The bound the run ended on, which an HTTP 413 may have lowered. A
       * retry that starts from the default again would earn the same 413.
       */
      maxBytes: number
      /**
       * Whether the run was delivering in Chunks when it stopped. A 413 turns
       * a one-request run into one, so this is the mode at the stop rather
       * than the mode it started in.
       */
      multiChunk: boolean
      /**
       * Chunks the server accepted before the stop. Zero with `multiChunk`
       * false means the outbox is untouched and this was one failed request.
       */
      acceptedChunks: number
      /** A single item exceeds the server limit; repacking cannot help. */
      itemTooLarge?: boolean
      cause?: unknown
    }
  /** The run cannot continue from here, and retrying it would be unsafe. */
  | { kind: 'abandoned'; progress: TPushProgressRow[]; message: string }

/** Whether a failed request is worth repeating unchanged. */
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

      // Every accepted Chunk has to retire at least one item, or the loop
      // would resend the same request forever. Only a receipt that fails to
      // match the command it came from can do this, which is a bug rather
      // than a state to retry from.
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
