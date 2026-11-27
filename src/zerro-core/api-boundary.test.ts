import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as root from './index'
import * as redux from './redux'

const coreRoot = dirname(fileURLToPath(import.meta.url))
const productionCoreEntrypoints = new Set([
  'zerro-core',
  'zerro-core/demo',
  'zerro-core/headless',
  'zerro-core/redux',
  'zerro-core/replica',
  'zerro-core/search',
])

describe('zerro-core API boundary', () => {
  it('exposes snapshot sessions and shared constants at the root', () => {
    expect(Object.keys(root).sort()).toEqual([
      'ZERRO_DATA_ACCOUNT_NAME',
      'createZerroSession',
    ])
  })

  it('exports the domain-grouped Redux adapter', () => {
    expect(Object.keys(redux)).toEqual(['core'])
    expect(Object.keys(redux.core).sort()).toEqual([
      'accounts',
      'activity',
      'balances',
      'budgets',
      'currency',
      'debtors',
      'envelopes',
      'fxRates',
      'goals',
      'instruments',
      'merchants',
      'months',
      'reminders',
      'restore',
      'settings',
      'tags',
      'transactions',
      'users',
    ])
  })

  it('keeps pure Core modules independent of the app runtime', () => {
    const violations = readProductionCoreFiles().flatMap(file => {
      const source = readFileSync(file, 'utf8')
      return readModuleSpecifiers(source)
        .filter(specifier => {
          if (specifier.startsWith('.')) {
            const target = resolve(dirname(file), specifier)
            const path = relative(dirname(coreRoot), target)
            return /^(?:store|[1-6]-[^/]+)(?:\/|$)/.test(path)
          }
          return /^(?:store|[1-6]-[^/]+|react|react-dom|react-redux|@reduxjs\/toolkit|i18next)(?:\/|$)/.test(
            specifier.replace(/^@\//, '')
          )
        })
        .map(
          specifier => `${relative(coreRoot, file)}: app import '${specifier}'`
        )
    })

    expect(violations).toEqual([])
  })

  it('keeps domain foundation independent of Zenmoney and Zerro', () => {
    const foundationRoot = join(coreRoot, 'internal/domain/foundation')
    const domainRoot = join(coreRoot, 'internal/domain')
    const forbiddenRoots = [
      join(domainRoot, 'zenmoney'),
      join(domainRoot, 'zerro'),
    ]
    const violations = walk(foundationRoot)
      .filter(file => file.endsWith('.ts') && !file.endsWith('.test.ts'))
      .flatMap(file => {
        const source = readFileSync(file, 'utf8')
        return readModuleSpecifiers(source)
          .filter(specifier => {
            if (specifier.startsWith('zerro-core/internal/domain/')) {
              return /zerro-core\/internal\/domain\/(?:zenmoney|zerro)/.test(
                specifier
              )
            }
            if (!specifier.startsWith('.')) return false
            const target = resolve(dirname(file), specifier)
            return forbiddenRoots.some(
              root => target === root || target.startsWith(root + sep)
            )
          })
          .map(
            specifier =>
              `${relative(coreRoot, file)}: foundation imports '${specifier}'`
          )
      })

    expect(violations).toEqual([])
  })

  it('keeps Zenmoney entities independent of its aggregate model', () => {
    const entitiesRoot = join(coreRoot, 'internal/domain/zenmoney/entities')
    const forbiddenRoots = [
      join(coreRoot, 'internal/domain/zenmoney/model'),
      join(coreRoot, 'internal/domain/zenmoney/read-models'),
    ]
    const violations = walk(entitiesRoot)
      .filter(file => file.endsWith('.ts') && !file.endsWith('.test.ts'))
      .flatMap(file => {
        const source = readFileSync(file, 'utf8')
        return readModuleSpecifiers(source)
          .filter(specifier => {
            if (specifier.startsWith('zerro-core/internal/domain/zenmoney/')) {
              return /zerro-core\/internal\/domain\/zenmoney\/(?:model|read-models)/.test(
                specifier
              )
            }
            if (!specifier.startsWith('.')) return false
            const target = resolve(dirname(file), specifier)
            return forbiddenRoots.some(
              root => target === root || target.startsWith(root + sep)
            )
          })
          .map(
            specifier =>
              `${relative(coreRoot, file)}: entity imports '${specifier}'`
          )
      })

    expect(violations).toEqual([])
  })

  it('keeps production consumers on declared Core entrypoints', () => {
    const appRoot = dirname(coreRoot)
    const violations = walk(appRoot)
      .filter(file => {
        const path = relative(appRoot, file)
        return (
          /\.(?:ts|tsx)$/.test(path) &&
          !path.startsWith('zerro-core/') &&
          !path.startsWith('6-shared/types/') &&
          !/\.(?:test|spec)\.tsx?$/.test(path)
        )
      })
      .flatMap(file => {
        const source = readFileSync(file, 'utf8')
        return readModuleSpecifiers(source)
          .filter(specifier => {
            if (specifier.startsWith('zerro-core')) {
              return !productionCoreEntrypoints.has(specifier)
            }
            if (!specifier.startsWith('.')) return false
            const target = resolve(dirname(file), specifier)
            return target === coreRoot || target.startsWith(coreRoot + sep)
          })
          .map(
            specifier =>
              `${relative(appRoot, file)}: undeclared Core import '${specifier}'`
          )
      })

    expect(violations).toEqual([])
  })

  it('keeps implementation layers off support modules', () => {
    const supportRoot = join(coreRoot, 'support')
    const violations = readProductionCoreFiles().flatMap(file => {
      const path = relative(coreRoot, file)
      if (path === 'demo.ts') return []
      const source = readFileSync(file, 'utf8')
      return readModuleSpecifiers(source)
        .filter(specifier => {
          if (specifier.startsWith('zerro-core/support/')) return true
          if (!specifier.startsWith('.')) return false
          const target = resolve(dirname(file), specifier)
          return target === supportRoot || target.startsWith(supportRoot + sep)
        })
        .map(
          specifier => `${path}: implementation imports support '${specifier}'`
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
      !path.startsWith('runtime/') &&
      !path.startsWith('support/')
    )
  })
}

function readModuleSpecifiers(source: string): string[] {
  return [
    ...source.matchAll(
      /\bfrom\s*['"]([^'"]+)['"]|\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g
    ),
  ].map(match => match[1] || match[2])
}

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  })
}
