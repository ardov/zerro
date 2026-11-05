import {
  createEmptyDataStore,
  type TIntentPatch,
} from '../../internal/domain/zenmoney/model/store'
import {
  entityOperations,
  entityOperationPatch,
  isEntityOperation,
} from '../../internal/domain/zenmoney/operations'
import type { TCommand } from '../../internal/operations/materialization'
import type { TOperation, TCompiled, TNormalizedPatch } from '../../types'
import type { TCommandLabel } from '../../internal/operations/materialization'
type TTestInput =
  TNormalizedPatch | TIntentPatch | TOperation[] | TCompiled<unknown>
import {
  prepareCommand,
  materializeCommand,
} from '../../internal/operations/materialization'
import type { TDataStore } from '../../types'

/** Unissued fixture fields: creation semantics are explicit in the resulting operations. */
export function testOperations(patch: TTestInput) {
  return 'operations' in patch
    ? patch.operations
    : Array.isArray(patch)
      ? patch
      : entityOperations(createEmptyDataStore(), patch)
}
export function operationPatch(
  command: Pick<TCommand, 'operations'>
): TIntentPatch {
  const patch: Record<string, unknown[]> = {}
  for (const operation of command.operations) {
    if (!isEntityOperation(operation))
      throw new Error('Expected entity operations')
    for (const [key, rows] of Object.entries(entityOperationPatch(operation)))
      patch[key] = [...(patch[key] ?? []), ...rows]
  }
  return patch as TIntentPatch
}
export function materializeTestInput(
  data: TDataStore,
  input: TTestInput,
  at = 100
) {
  return materializeCommand(data, prepareTestCommand(data, input, at))
}

/** Concise entity fixtures share the production operation preparation path. */
export function prepareTestCommand(
  data: TDataStore,
  input: TTestInput,
  at: number,
  label?: TCommandLabel
) {
  const operations =
    'operations' in input
      ? input.operations
      : Array.isArray(input)
        ? input
        : entityOperations(data, input)
  return prepareCommand(data, operations, at, label)
}
