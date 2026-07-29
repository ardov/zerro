// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { parseCommand } from './cliParser'
import { getHelp, getHelpShape } from './help'
import type { TMeta } from './output'
import { successShapes } from './shapes'

const sampleMeta: TMeta = {
  observedAt: '2026-07-29T00:00:00.000Z',
  baseServerTimestampMs: 0,
  stateRevision: 'revision',
  pendingCommandCount: 0,
  balancePendingCanonicalSync: false,
  rates: { base: 'RUB', values: { RUB: 1 } },
}

describe('local tool help manifest', () => {
  it('describes every W0-W3 command with explicit side effects', () => {
    const result = getHelp(sampleMeta)

    expect(
      result.data.commands.map(command => [command.name, command.effect])
    ).toEqual([
      ['help', 'none'],
      ['version', 'none'],
      ['status', 'none'],
      ['refresh', 'local'],
      ['sync', 'remote'],
      ['accounts list', 'none'],
      ['tags search', 'none'],
      ['merchants search', 'none'],
      ['transactions search', 'none'],
      ['month get', 'none'],
      ['months list', 'none'],
      ['envelopes list', 'none'],
      ['envelopes get', 'none'],
      ['goals list', 'none'],
      ['debtors list', 'none'],
      ['report activity', 'none'],
      ['budget preview-set', 'none'],
      ['budget stage-set', 'local'],
      ['outbox list', 'none'],
      ['outbox undo', 'local'],
      ['transaction preview-create', 'none'],
      ['transaction stage-create', 'local'],
    ])
  })

  it('has examples that the CLI parser actually accepts', () => {
    const result = getHelp(sampleMeta)

    for (const entry of result.data.commands) {
      const argv = argvFromExample(entry.example)
      const parsed = parseCommand(argv)
      expect(parsed.command, entry.example).toBe(entry.name)
    }
  })

  it('has a shapes.ts entry for every successShape named in the manifest', () => {
    const result = getHelp(sampleMeta)
    for (const entry of result.data.commands) {
      expect(successShapes, entry.successShape).toHaveProperty(
        entry.successShape
      )
    }
  })

  it('does not carry orphaned shapes no command refers to', () => {
    const result = getHelp(sampleMeta)
    const referenced: Set<string> = new Set(
      result.data.commands.map(command => command.successShape)
    )
    for (const name of Object.keys(successShapes)) {
      expect(referenced.has(name), name).toBe(true)
    }
  })

  it('resolves field descriptions for a known shape via --shape', () => {
    const result = getHelpShape(sampleMeta, 'monthSummary')
    expect(result.data.shape).toBe('monthSummary')
    expect(result.data.fields['totals.budgeted']).toEqual(expect.any(String))
  })

  it('rejects an unknown --shape name', () => {
    expect(() => getHelpShape(sampleMeta, 'notAShape')).toThrow(
      expect.objectContaining({ code: 'INVALID_INPUT' })
    )
  })

  it('exposes an orientation guide listing every successShape', () => {
    const result = getHelp(sampleMeta)
    expect(result.data.guide.successShapes).toEqual(
      Object.keys(successShapes).sort()
    )
  })

  it('describes optional flags as typed objects, not bare strings', () => {
    const result = getHelp(sampleMeta)
    const accounts = result.data.commands.find(
      command => command.name === 'accounts list'
    )
    expect(accounts?.optional).toContainEqual(
      expect.objectContaining({ name: '--limit', type: 'integer', default: 50 })
    )
    const report = result.data.commands.find(
      command => command.name === 'report activity'
    )
    expect(report?.optional).toContainEqual(
      expect.objectContaining({
        name: '--direction',
        type: 'enum',
        values: ['net', 'outcome', 'income'],
        default: 'net',
      })
    )
  })
})

function argvFromExample(example: string): string[] {
  const marker = 'pnpm zerro '
  const index = example.indexOf(marker)
  const rest = example.slice(index + marker.length)
  return rest.split(' ').filter(Boolean)
}
