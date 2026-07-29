import { ToolError } from './output'

export type TNamedEntity = { id: string; title: string }

/**
 * Resolves a user-supplied --account/--tag/--merchant value to a real id.
 * Tries, in order: exact id, exact title, case-insensitive title. On a miss,
 * throws ENTITY_NOT_FOUND with up to 5 substring-matching candidates so the
 * caller can retry without guessing at exact casing or the underlying id.
 */
export function resolveEntityId(
  entities: Record<string, TNamedEntity>,
  value: string,
  input: { command: string; option: string; entityLabel: string }
): string {
  if (entities[value]) return value

  const lower = value.toLocaleLowerCase()
  const exactTitle = Object.values(entities).find(
    entity => entity.title.toLocaleLowerCase() === lower
  )
  if (exactTitle) return exactTitle.id

  const candidates = Object.values(entities)
    .filter(entity => entity.title.toLocaleLowerCase().includes(lower))
    .slice(0, 5)
    .map(entity => `${entity.id} (${entity.title})`)

  throw new ToolError(
    input.command,
    'none',
    'ENTITY_NOT_FOUND',
    `${input.entityLabel} was not found`,
    3,
    { [input.option]: value, candidates }
  )
}

/** Resolves a comma-separated list of --tag/--merchant values to real ids. */
export function resolveEntityIds(
  entities: Record<string, TNamedEntity>,
  csv: string,
  input: { command: string; option: string; entityLabel: string }
): string[] {
  return csv
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => resolveEntityId(entities, part, input))
}
