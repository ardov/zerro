import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const coreRoot = dirname(fileURLToPath(import.meta.url))

describe('zerro-core API boundary', () => {
  it('keeps the root entrypoint facade-only', () => {
    const rootIndex = readFileSync(join(coreRoot, 'index.ts'), 'utf8')

    expect(rootIndex).not.toMatch(
      /from ['"]\.\/(?:domain|redux|infrastructure|presentation)/
    )
  })

  it('pins the domain-grouped Redux adapter surface', () => {
    const adapterIndex = readFileSync(join(coreRoot, 'redux/index.ts'), 'utf8')
    expect(
      [...adapterIndex.matchAll(/export \* as (\w+) from/g)]
        .map(match => match[1])
        .sort()
    ).toEqual(
      [
        'accounts',
        'activity',
        'balances',
        'budgets',
        'currency',
        'debtors',
        'envelopes',
        'fxRates',
        'goals',
        'infrastructure',
        'instruments',
        'merchants',
        'months',
        'reminders',
        'settings',
        'tags',
        'transactions',
        'users',
      ].sort()
    )
    expect(adapterIndex).not.toMatch(/export \{[\s\S]*?\} from/)
    expect(adapterIndex).not.toContain('applyLegacyPatch')
  })

  it('keeps production core free from app runtime imports', () => {
    const violations = readProductionCoreFiles().flatMap(file => {
      const source = readFileSync(file, 'utf8')
      return source
        .split('\n')
        .map((line, index) => ({ line, index }))
        .filter(
          ({ line }) =>
            /from ['"](?:store|react|react-redux|@reduxjs\/toolkit|5-entities(?:\/[^'"]*)?|6-shared\/localization|6-shared\/tagIcons\.json|i18next)['"]/.test(
              line
            ) ||
            /from ['"]6-shared\/(?:tagIconsSvg|icons\/[^'"]*)['"]/.test(line)
        )
        .map(
          ({ line, index }) =>
            `${relative(coreRoot, file)}:${index + 1}: ${line.trim()}`
        )
    })

    expect(violations).toEqual([])
  })

  it('keeps production core free from any 6-shared imports', () => {
    const violations = readProductionCoreFiles().flatMap(file => {
      const source = readFileSync(file, 'utf8')
      return source
        .split('\n')
        .map((line, index) => ({ line, index }))
        .filter(({ line }) => /from ['"]6-shared\//.test(line))
        .map(
          ({ line, index }) =>
            `${relative(coreRoot, file)}:${index + 1}: ${line.trim()}`
        )
    })

    expect(violations).toEqual([])
  })

  it('keeps the Redux adapter off legacy entity ownership', () => {
    const violations = walk(join(coreRoot, 'redux'))
      .filter(file => file.endsWith('.ts') && !file.endsWith('.test.ts'))
      .flatMap(file => {
        const source = readFileSync(file, 'utf8')
        return source
          .split('\n')
          .map((line, index) => ({ line, index }))
          .filter(({ line }) =>
            /from ['"]5-entities(?:\/[^'"]*)?['"]/.test(line)
          )
          .map(
            ({ line, index }) =>
              `${relative(coreRoot, file)}:${index + 1}: ${line.trim()}`
          )
      })

    expect(violations).toEqual([])
  })

  it('keeps app consumers off Core implementation subpaths', () => {
    const appRoot = dirname(coreRoot)
    const violations = walk(appRoot)
      .filter(file => {
        const path = relative(appRoot, file)
        return (
          /\.(?:ts|tsx)$/.test(path) &&
          !path.startsWith('zerro-core/') &&
          !path.startsWith('6-shared/types/') &&
          !path.endsWith('.test.ts')
        )
      })
      .flatMap(file => {
        const source = readFileSync(file, 'utf8')
        return source
          .split('\n')
          .map((line, index) => ({ line, index }))
          .filter(({ line }) =>
            /from ['"]zerro-core\/(?:domain|application|presentation|redux\/)/.test(
              line
            )
          )
          .map(
            ({ line, index }) =>
              `${relative(appRoot, file)}:${index + 1}: ${line.trim()}`
          )
      })

    expect(violations).toEqual([])
  })

  it('keeps production code off legacy model-object calls', () => {
    const appRoot = dirname(coreRoot)
    const violations = walk(appRoot)
      .filter(file => {
        const path = relative(appRoot, file)
        return (
          /\.(?:ts|tsx)$/.test(path) &&
          !path.endsWith('.test.ts') &&
          !path.endsWith('.test.tsx')
        )
      })
      .flatMap(file => {
        const source = readFileSync(file, 'utf8')
        return source
          .split('\n')
          .map((line, index) => ({ line, index }))
          .filter(
            ({ line }) =>
              /\b[A-Za-z]\w*Model\s*\./.test(line) ||
              /\bexport const [A-Za-z]\w*Model\b/.test(line)
          )
          .map(
            ({ line, index }) =>
              `${relative(appRoot, file)}:${index + 1}: ${line.trim()}`
          )
      })

    expect(violations).toEqual([])
  })
})

function readProductionCoreFiles(): string[] {
  return walk(coreRoot).filter(file => {
    const path = relative(coreRoot, file)
    return (
      path.endsWith('.ts') &&
      !path.endsWith('.test.ts') &&
      !path.startsWith('redux/') &&
      !path.startsWith('documents/') &&
      !path.startsWith('testing/')
    )
  })
}

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  })
}
