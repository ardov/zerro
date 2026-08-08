import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const coreRoot = dirname(fileURLToPath(import.meta.url))
const productionCoreEntrypoints = new Set([
  'zerro-core',
  'zerro-core/demo',
  'zerro-core/headless',
  'zerro-core/redux',
  'zerro-core/replica',
])

describe('zerro-core API boundary', () => {
  it('keeps only ownership layers as root directories', () => {
    const directories = readdirSync(coreRoot, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .sort()

    expect(directories).toEqual(['internal', 'public', 'runtime', 'support'])
  })

  it('keeps the root entrypoint facade-only', () => {
    const rootIndex = readFileSync(join(coreRoot, 'index.ts'), 'utf8')

    expect(rootIndex).not.toMatch(
      /from ['"]\.\/(?:domain|redux|infrastructure|presentation)/
    )
  })

  it('pins the domain-grouped Redux adapter surface', () => {
    // The root exposes the runtime adapter through a thin public facade.
    const adapterIndex = readFileSync(join(coreRoot, 'redux.ts'), 'utf8')
    expect(adapterIndex).toMatch(/export \* from ['"]\.\/runtime\/redux['"]/)

    // The domains it groups are pinned in the runtime implementation.
    const namespaces = readFileSync(
      join(coreRoot, 'runtime/redux/namespaces.ts'),
      'utf8'
    )
    expect(
      [...namespaces.matchAll(/export \* as (\w+) from/g)]
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
        'instruments',
        'merchants',
        'months',
        'reminders',
        'restore',
        'settings',
        'tags',
        'transactions',
        'users',
      ].sort()
    )
    expect(namespaces).not.toContain('applyLegacyPatch')
  })

  it('keeps the Redux data path behind one raw-input selector', () => {
    const stateModule = readFileSync(
      join(coreRoot, 'runtime/redux/state.ts'),
      'utf8'
    )
    expect(
      [...stateModule.matchAll(/export const (\w+)/g)].map(match => match[1])
    ).toEqual(['selectData'])

    const violations = walk(join(coreRoot, 'runtime/redux'))
      .filter(
        file =>
          file.endsWith('.ts') &&
          !file.endsWith('.test.ts') &&
          file !== join(coreRoot, 'runtime/redux/state.ts')
      )
      .flatMap(file => {
        const source = readFileSync(file, 'utf8')
        return source.includes('state.data.current')
          ? [relative(coreRoot, file)]
          : []
      })

    expect(violations).toEqual([])
  })

  it('keeps the replica integration entrypoint explicit', () => {
    const replicaIndex = readFileSync(join(coreRoot, 'replica.ts'), 'utf8')

    expect(replicaIndex).not.toMatch(/export \*/)
    expect(replicaIndex).toContain('appendOutbox')
    expect(replicaIndex).toContain('parseCommandOutbox')
  })

  it('keeps the headless source entrypoint narrow and explicit', () => {
    const headlessIndex = readFileSync(join(coreRoot, 'headless.ts'), 'utf8')

    expect(headlessIndex).not.toMatch(/export \*/)
    expect(headlessIndex).toContain('createZerroSession')
    expect(headlessIndex).toContain('compileCreateTransaction')
    expect(headlessIndex).toContain('acceptCanonicalPatch')
    expect(headlessIndex).toContain('parseCommandOutbox')
    expect(headlessIndex).not.toContain('parsePersistedReplica')
    expect(headlessIndex).not.toMatch(
      /from ['"]\.\/internal\/domain\/(?:zenmoney|zerro)['"]/
    )
  })

  it('keeps the local tool on explicit Core entrypoints', () => {
    const toolRoot = join(coreRoot, '../../tools/zerro/src')
    const violations = walk(toolRoot)
      .filter(file => file.endsWith('.ts') && !file.endsWith('.test.ts'))
      .flatMap(file =>
        readModuleSpecifiers(readFileSync(file, 'utf8'))
          .filter(specifier => specifier.startsWith('zerro-core/internal/'))
          .map(
            specifier => `${relative(toolRoot, file)} imports '${specifier}'`
          )
      )

    expect(violations).toEqual([])
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
            ) || /from ['"]6-shared\/icons\/[^'"]*['"]/.test(line)
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

  it('keeps domain foundation independent of ZenMoney and Zerro', () => {
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

  it('keeps ZenMoney entities independent of its aggregate model', () => {
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

  it('keeps domain dependencies explicit without source-wrapper types', () => {
    const violations = walk(join(coreRoot, 'internal/domain'))
      .filter(file => file.endsWith('.ts') && !file.endsWith('.test.ts'))
      .flatMap(file => {
        const source = readFileSync(file, 'utf8')
        return [...source.matchAll(/\btype\s+(T\w+Source)\b/g)].map(
          match => `${relative(coreRoot, file)}: ${match[1]}`
        )
      })

    expect(violations).toEqual([])
  })

  it('keeps production imports off the broad ZenMoney barrel', () => {
    const violations = readProductionCoreFiles().flatMap(file => {
      const source = readFileSync(file, 'utf8')
      return readModuleSpecifiers(source)
        .filter(
          specifier =>
            specifier === './internal/domain/zenmoney' ||
            specifier === '../../internal/domain/zenmoney' ||
            specifier === 'zerro-core/internal/domain/zenmoney'
        )
        .map(
          specifier =>
            `${relative(coreRoot, file)}: broad ZenMoney import '${specifier}'`
        )
    })

    expect(violations).toEqual([])
  })

  it('keeps the Redux adapter off legacy entity ownership', () => {
    const violations = walk(join(coreRoot, 'runtime/redux'))
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
      !path.startsWith('redux/') &&
      !path.startsWith('runtime/') &&
      !path.startsWith('support/') &&
      !path.startsWith('testing/')
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
