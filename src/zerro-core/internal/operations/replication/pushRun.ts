import {
  clearAbsentReferences,
  entityCleanupOrder,
  entityProgressOrder,
  entityUpsertOrder,
  isAbsentRow,
  isRowWritable,
  type TDataEntityKey,
  type TDataStore,
  type TIntentEntityKey,
  type TIntentPatch,
  type TNormalizedPatch,
  type TRowPresence,
} from '../../domain/zenmoney'
import { applyPatch } from '../../domain/zenmoney'
import { issuePatch, type TCommand } from '../materialization'
import { getSyncCursor } from './cursor'
import { buildOutboxTransport, replayOutbox } from './outbox'

export const DEFAULT_PUSH_MAX_BYTES = 2 * 1024 * 1024

/**
 * How large the transmitted body is. The default measures the normalized
 * patch; a host that converts to another representation before sending passes
 * its own, so the bound is checked against the bytes that actually travel.
 */
export type TPushMeasure = (request: TNormalizedPatch) => number

const cleanupRank = new Map<TDataEntityKey, number>(
  entityCleanupOrder.map((key, index) => [key, index])
)

export type TPushProgressRow = {
  key: TDataEntityKey
  confirmed: number
  total: number
}

type TPushItemIdentity =
  | { kind: 'upsert'; key: TIntentEntityKey; id: string | number }
  | {
      kind: 'deletion'
      key: TDataEntityKey
      id: string | number
    }

type TPushChunkReceipt = {
  items: TPushItemIdentity[]
}

export type TPushRun = {
  capturedOutboxCount: number
  command: TCommand
  sentAt: number
  maxBytes: number
  measure: TPushMeasure
  multiChunk: boolean
  totals: Partial<Record<TDataEntityKey, number>>
}

export type TPreparedPush = {
  run: TPushRun
  request: TNormalizedPatch
  progress: TPushProgressRow[]
  requestItemCount: number
  receipt: TPushChunkReceipt
}

export type TAcceptedPushChunk = {
  base: TDataStore
  current: TDataStore
  outbox: TCommand[]
  redo: TCommand[]
  progress: TPushProgressRow[]
  next?: TPreparedPush
}

export type TBeginPushOptions = {
  maxBytes?: number
  measure?: TPushMeasure
}

export function beginPush(
  replica: { base: TDataStore; outbox: readonly TCommand[] },
  sentAt: number,
  options: TBeginPushOptions = {}
): TPreparedPush | undefined {
  if (!replica.outbox.length) return undefined
  const rawTransport = buildOutboxTransport(
    replica.base,
    replica.outbox,
    sentAt
  )
  if (!rawTransport) return undefined
  const transport = sanitizePushReferences(replica.base, rawTransport)

  const command = issuePatch(replica.base, transport, sentAt)
  const maxBytes = options.maxBytes ?? DEFAULT_PUSH_MAX_BYTES
  requirePositiveByteLimit(maxBytes)
  const measure = options.measure ?? measureNormalizedBytes
  const fullRequest = withCursor(replica.base, transport)
  const itemCount = allItems(transport, replica.base).length
  const run: TPushRun = {
    capturedOutboxCount: replica.outbox.length,
    command,
    sentAt,
    maxBytes,
    measure,
    multiChunk:
      measure(fullRequest) > maxBytes || requiresSingletonCleanup(transport),
    totals: countCommandItems(command),
  }
  if (!itemCount) {
    return {
      run,
      request: fullRequest,
      progress: [],
      requestItemCount: 0,
      receipt: { items: [] },
    }
  }
  return preparePush(run, replica.base)
}

export function acceptPushChunk(
  replica: {
    base: TDataStore
    outbox: readonly TCommand[]
    redo?: readonly TCommand[]
  },
  prepared: TPreparedPush,
  canonicalPatch: TNormalizedPatch
): TAcceptedPushChunk {
  if (prepared.run.capturedOutboxCount > replica.outbox.length) {
    throw new Error('Captured push prefix is no longer present')
  }

  const base = applyPatch(replica.base, canonicalPatch)
  const withoutSent = removeItems(prepared.run.command, prepared.receipt.items)
  const remaining = normalizeRemainingCommand(
    base,
    withoutSent,
    prepared.run.sentAt
  )
  const suffix = replica.outbox.slice(prepared.run.capturedOutboxCount)
  const outbox = remaining ? [remaining, ...suffix] : [...suffix]
  const progress = progressRows(prepared.run.totals, remaining)
  const current = replayOutbox(base, outbox)

  if (!remaining) {
    return { base, current, outbox, redo: [], progress }
  }

  const run: TPushRun = {
    ...prepared.run,
    capturedOutboxCount: 1,
    command: remaining,
  }
  const next = preparePush(run, base)
  if (!next) throw new Error('Remaining push command produced no request')
  return { base, current, outbox, redo: [], progress, next }
}

/** Repack the current unconfirmed request after HTTP 413. */
export function shrinkPushChunk(
  replica: { base: TDataStore },
  prepared: TPreparedPush
): TPreparedPush | undefined {
  if (prepared.requestItemCount <= 1) return undefined
  const maxBytes = Math.max(1, Math.floor(prepared.run.maxBytes / 2))
  return preparePush(
    { ...prepared.run, maxBytes, multiChunk: true },
    replica.base
  )
}

function preparePush(
  run: TPushRun,
  base: TDataStore
): TPreparedPush | undefined {
  const transport = buildOutboxTransport(base, [run.command], run.sentAt)
  if (!transport) return undefined
  const selected = run.multiChunk
    ? packNextPhase(transport, base, run)
    : allItems(transport, base)
  const request = withCursor(base, itemsToPatch(selected))
  return {
    run,
    request,
    progress: progressRows(run.totals, run.command),
    requestItemCount: selected.length,
    receipt: { items: selected.map(item => item.identity) },
  }
}

function requiresSingletonCleanup(transport: TNormalizedPatch): boolean {
  const deletions = transport.deletion ?? []
  return deletions.some(
    deletion => deletion.object === 'account' || deletion.object === 'tag'
  )
}

/**
 * Canonical snapshots may retain historical rows whose required owner no
 * longer exists. They remain readable, but the write API refuses to recreate
 * them. The entity graph names those references; normalize at the transport
 * seam as well as during restore planning so commands already persisted in
 * the outbox are safe to retry.
 */
function sanitizePushReferences(
  base: TDataStore,
  transport: TNormalizedPatch
): TNormalizedPatch {
  const world = projectedWorld(base, transport)
  const result: TNormalizedPatch = { ...transport }

  // Write order, so a pruned owner is already gone from the projection when
  // its dependants are considered.
  entityUpsertOrder.forEach(key => {
    const rows = transport[key] as readonly TRow[] | undefined
    if (!rows) return
    const kept: TRow[] = []
    rows.forEach(row => {
      if (!isRowWritable(key, row, world.present)) {
        world.drop(key, row.id)
        return
      }
      const cleared = clearAbsentReferences(key, row, world.present)
      world.replace(key, cleared)
      kept.push(cleared)
    })
    if (kept.length) (result as TPatchRecord)[key] = kept
    else delete (result as TPatchRecord)[key]
  })

  const deletedAccountIds = new Set(
    (transport.deletion ?? [])
      .filter(deletion => deletion.object === 'account')
      .map(deletion => String(deletion.id))
  )
  // Rows the account cascade removes anyway. Sending them would ask the
  // server to recreate an operation inside an account it is deleting.
  if (result.transaction) {
    const transactions = result.transaction.filter(
      transaction =>
        !bothLegsInsideDeletedAccounts(transaction, deletedAccountIds)
    )
    if (transactions.length) result.transaction = transactions
    else delete result.transaction
  }

  return result
}

/**
 * Which rows the world holds once this request is applied: whatever the
 * snapshot already has, plus the patch's own upserts, minus its deletions and
 * the rows a write never contains. A row dropped from the patch falls back to
 * the snapshot, which may still hold it.
 */
function projectedWorld(base: TDataStore, transport: TNormalizedPatch) {
  const deleted = new Set(
    (transport.deletion ?? []).map(deletion =>
      lookupKey(deletion.object, deletion.id)
    )
  )
  const upserted = new Map<string, TRow>()
  entityUpsertOrder.forEach(key => {
    const rows = transport[key] as readonly TRow[] | undefined
    rows?.forEach(row => upserted.set(lookupKey(key, row.id), row))
  })

  const present: TRowPresence = (key, id) => {
    if (typeof id !== 'string' && typeof id !== 'number') return false
    const lookup = lookupKey(key, id)
    if (deleted.has(lookup)) return false
    const row = upserted.has(lookup)
      ? upserted.get(lookup)
      : (base[key] as Record<string, TRow | undefined>)[String(id)]
    return row !== undefined && !isAbsentRow(key, row)
  }

  return {
    present,
    drop: (key: TDataEntityKey, id: string | number) =>
      upserted.delete(lookupKey(key, id)),
    replace: (key: TDataEntityKey, row: TRow) =>
      upserted.set(lookupKey(key, row.id), row),
  }
}

function lookupKey(key: TDataEntityKey, id: string | number): string {
  return `${key}:${String(id)}`
}

function bothLegsInsideDeletedAccounts(
  transaction: { incomeAccount: unknown; outcomeAccount: unknown },
  deletedAccountIds: ReadonlySet<string>
): boolean {
  const leg = (id: unknown) =>
    id !== null && deletedAccountIds.has(String(id))
  return leg(transaction.incomeAccount) && leg(transaction.outcomeAccount)
}

type TRow = { id: string | number; [field: string]: unknown }
type TPatchRecord = Record<string, unknown[] | undefined>

type TPushItem = {
  identity: TPushItemIdentity
  key: TIntentEntityKey | 'deletion'
  value: TRow
}

function allItems(transport: TNormalizedPatch, base: TDataStore): TPushItem[] {
  return [...orderedUpserts(transport), ...orderedDeletions(transport, base)]
}

/**
 * The next chunk: one phase at a time, upserts before deletions, and never
 * more than the byte bound allows. A singleton deletion travels alone because
 * the server cascade it triggers has to be applied before the rest is planned.
 */
function packNextPhase(
  transport: TNormalizedPatch,
  base: TDataStore,
  run: TPushRun
): TPushItem[] {
  const upserts = orderedUpserts(transport)
  const candidates = upserts.length
    ? upserts
    : orderedDeletions(transport, base)
  if (!candidates.length) return []
  if (isSingletonDeletion(candidates[0])) return [candidates[0]]

  const singleton = candidates.findIndex(isSingletonDeletion)
  const packable =
    singleton === -1 ? candidates : candidates.slice(0, singleton)
  return packable.slice(0, largestFittingPrefix(packable, base, run))
}

/**
 * The longest prefix whose serialized request fits.
 *
 * Measuring the whole remainder to learn that would serialize the entire run
 * once per Chunk, which is quadratic in the size of the push — worst exactly
 * on the large restores Chunks exist for. So a rough per-entity cost estimate
 * picks the starting point and only the few prefixes around it are measured
 * for real. One item always ships: a single oversized row is HTTP 413's
 * business, not the packer's.
 */
function largestFittingPrefix(
  items: readonly TPushItem[],
  base: TDataStore,
  run: TPushRun
): number {
  const fits = (count: number) =>
    run.measure(withCursor(base, itemsToPatch(items.slice(0, count)))) <=
    run.maxBytes

  const guess = Math.min(items.length, estimateFittingPrefix(items, base, run))
  if (!fits(guess)) return narrowFittingPrefix(fits, 1, guess)

  // The estimate was low. Doubling steps find an overshoot in a few probes,
  // and every probe stays near the bound instead of near the remainder.
  let fitting = guess
  let step = 1
  while (fitting < items.length) {
    const probe = Math.min(items.length, fitting + step)
    if (!fits(probe)) return narrowFittingPrefix(fits, fitting, probe)
    fitting = probe
    step *= 2
  }
  return items.length
}

/** The largest count between the two bounds that fits, by halving. */
function narrowFittingPrefix(
  fits: (count: number) => boolean,
  fitting: number,
  excessive: number
): number {
  while (excessive - fitting > 1) {
    const middle = Math.floor((fitting + excessive) / 2)
    if (fits(middle)) fitting = middle
    else excessive = middle
  }
  return fitting
}

const ESTIMATE_SAMPLE_SIZE = 8

/**
 * How many items fit, guessed from an average cost per entity kind instead of
 * measured. Rows inside one kind still differ, so this only has to land near
 * the bound — `largestFittingPrefix` measures the exact edge from here.
 */
function estimateFittingPrefix(
  items: readonly TPushItem[],
  base: TDataStore,
  run: TPushRun
): number {
  const overhead = run.measure(withCursor(base, {}))
  const costByKind = new Map<string, number>()
  const costOf = (item: TPushItem): number => {
    const kind = estimateKind(item)
    const known = costByKind.get(kind)
    if (known !== undefined) return known
    const sample = sampleOfKind(items, kind)
    const measured = run.measure(withCursor(base, itemsToPatch(sample)))
    const cost = Math.max(1, (measured - overhead) / sample.length)
    costByKind.set(kind, cost)
    return cost
  }

  // Stops at the first overshoot, so the walk covers one Chunk rather than
  // the whole remainder.
  let total = overhead
  let count = 0
  for (const item of items) {
    total += costOf(item)
    if (total > run.maxBytes) break
    count += 1
  }
  return Math.max(1, count)
}

/** Deletions of every entity share one shape; upserts do not. */
function estimateKind(item: TPushItem): string {
  return item.key === 'deletion' ? 'deletion' : item.key
}

/** Evenly spaced, so one unusual leading row does not set the pace. */
function sampleOfKind(
  items: readonly TPushItem[],
  kind: string
): TPushItem[] {
  const ofKind = items.filter(item => estimateKind(item) === kind)
  if (ofKind.length <= ESTIMATE_SAMPLE_SIZE) return ofKind
  const stride = ofKind.length / ESTIMATE_SAMPLE_SIZE
  return Array.from(
    { length: ESTIMATE_SAMPLE_SIZE },
    (_, index) => ofKind[Math.floor(index * stride)]
  )
}

function isSingletonDeletion(item: TPushItem): boolean {
  return (
    item.identity.kind === 'deletion' &&
    (item.identity.key === 'account' || item.identity.key === 'tag')
  )
}

function orderedUpserts(transport: TNormalizedPatch): TPushItem[] {
  return entityUpsertOrder.flatMap(key => {
    const values = (transport[key] ?? []) as readonly TRow[]
    const ordered = key === 'tag' ? parentFirstTags(values) : values
    return ordered.map(value => ({
      identity: { kind: 'upsert' as const, key, id: value.id },
      key,
      value,
    }))
  })
}

function orderedDeletions(
  transport: TNormalizedPatch,
  base: TDataStore
): TPushItem[] {
  const tagDepth = tagDepthReader(base)
  return [...(transport.deletion ?? [])]
    .sort((left, right) => {
      const rank =
        (cleanupRank.get(left.object) ?? Number.MAX_SAFE_INTEGER) -
        (cleanupRank.get(right.object) ?? Number.MAX_SAFE_INTEGER)
      if (rank || left.object !== 'tag' || right.object !== 'tag') return rank
      return tagDepth(right.id) - tagDepth(left.id)
    })
    .map(value => ({
      identity: {
        kind: 'deletion' as const,
        key: value.object,
        id: value.id,
      },
      key: 'deletion' as const,
      value,
    }))
}

function tagDepthReader(base: TDataStore): (id: string | number) => number {
  const memo = new Map<string, number>()
  const read = (id: string | number, visiting = new Set<string>()): number => {
    const key = String(id)
    const cached = memo.get(key)
    if (cached !== undefined) return cached
    if (visiting.has(key)) return 0
    const parent = base.tag[key]?.parent
    if (parent === null || parent === undefined) {
      memo.set(key, 0)
      return 0
    }
    const nextVisiting = new Set(visiting).add(key)
    const depth = read(parent, nextVisiting) + 1
    memo.set(key, depth)
    return depth
  }
  return read
}

function parentFirstTags<T extends { id: string | number }>(
  values: readonly T[]
): T[] {
  const byId = new Map(values.map(value => [value.id, value]))
  const visiting = new Set<string | number>()
  const visited = new Set<string | number>()
  const result: T[] = []
  const visit = (value: T) => {
    if (visited.has(value.id)) return
    if (visiting.has(value.id)) return
    visiting.add(value.id)
    const parent = (value as { parent?: unknown }).parent
    if (typeof parent === 'string' || typeof parent === 'number') {
      const parentValue = byId.get(parent)
      if (parentValue) visit(parentValue)
    }
    visiting.delete(value.id)
    visited.add(value.id)
    result.push(value)
  }
  values.forEach(visit)
  return result
}

function itemsToPatch(items: readonly TPushItem[]): TNormalizedPatch {
  const patch: TNormalizedPatch = {}
  const record = patch as TPatchRecord
  items.forEach(item => {
    const values = record[item.key] ?? []
    record[item.key] = [...values, item.value]
  })
  return patch
}

function removeItems(
  command: TCommand,
  identities: readonly TPushItemIdentity[]
): TCommand {
  const sent = new Set(identities.map(identityKey))
  const patch: TIntentPatch = {}
  entityUpsertOrder.forEach(key => {
    const values = command.patch[key]
    if (!values) return
    const remaining = values.filter(
      value => !sent.has(identityKey({ kind: 'upsert', key, id: value.id }))
    )
    if (remaining.length) (patch as Record<string, unknown>)[key] = remaining
  })
  const deletions = command.patch.deletion?.filter(
    value =>
      !sent.has(
        identityKey({
          kind: 'deletion',
          key: value.object,
          id: value.id,
        })
      )
  )
  if (deletions?.length) patch.deletion = deletions
  return { type: 'patch', issuedAt: command.issuedAt, patch }
}

function normalizeRemainingCommand(
  base: TDataStore,
  command: TCommand,
  sentAt: number
): TCommand | undefined {
  if (!commandItemCount(command)) return undefined
  const transport = buildOutboxTransport(base, [command], sentAt)
  return transport ? issuePatch(base, transport, command.issuedAt) : undefined
}

function countCommandItems(
  command: TCommand
): Partial<Record<TDataEntityKey, number>> {
  const counts: Partial<Record<TDataEntityKey, number>> = {}
  entityUpsertOrder.forEach(key => {
    const count = command.patch[key]?.length ?? 0
    if (count) counts[key] = count
  })
  command.patch.deletion?.forEach(item => {
    counts[item.object] = (counts[item.object] ?? 0) + 1
  })
  return counts
}

function commandItemCount(command: TCommand): number {
  return Object.values(countCommandItems(command)).reduce(
    (sum, count) => sum + (count ?? 0),
    0
  )
}

function progressRows(
  totals: Partial<Record<TDataEntityKey, number>>,
  remaining?: TCommand
): TPushProgressRow[] {
  const remainingCounts = remaining ? countCommandItems(remaining) : {}
  return entityProgressOrder.flatMap(key => {
    const total = totals[key] ?? 0
    return total
      ? [{ key, total, confirmed: total - (remainingCounts[key] ?? 0) }]
      : []
  })
}

function withCursor(
  base: TDataStore,
  patch: TNormalizedPatch
): TNormalizedPatch {
  return { ...patch, serverTimestamp: getSyncCursor(base.serverTimestamp) }
}

function measureNormalizedBytes(request: TNormalizedPatch): number {
  return new TextEncoder().encode(JSON.stringify(request)).byteLength
}

function identityKey(identity: TPushItemIdentity): string {
  return `${identity.kind}:${identity.key}:${typeof identity.id}:${String(identity.id)}`
}

function requirePositiveByteLimit(value: number): void {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error('Push byte limit must be a positive safe integer')
  }
}
