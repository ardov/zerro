import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const coreRoot = dirname(fileURLToPath(import.meta.url))

describe('core-next API boundary', () => {
  it('keeps the root entrypoint facade-only', () => {
    const rootIndex = readFileSync(join(coreRoot, 'index.ts'), 'utf8')

    expect(rootIndex).not.toMatch(
      /from ['"]\.\/(?:zenmoney|zerro|adapters|engine)/
    )
  })

  it('pins the Redux adapter command surface', () => {
    const adapterIndex = readFileSync(
      join(coreRoot, 'adapters/redux/index.ts'),
      'utf8'
    )
    const commandBlock = adapterIndex.match(
      /export \{([\s\S]*?)\} from ['"]\.\/commands['"]/
    )?.[1]

    expect(commandBlock).toBeDefined()
    expect(
      commandBlock
        ?.split(',')
        .map(name => name.trim().replace(/^type\s+/, ''))
        .filter(Boolean)
        .sort()
    ).toEqual(
      [
        'applyChangesToTransaction',
        'applyDebugPatch',
        'applyEnvelopeStructure',
        'bulkEditTransactions',
        'combineTransactionsToIncome',
        'combineTransactionsToOutcome',
        'createEnvelope',
        'deleteTransactions',
        'deleteTransactionsPermanently',
        'deleteReminder',
        'editFxRates',
        'mergeAccounts',
        'mergeTransactionsAsTransfer',
        'prepareDataAccount',
        'recreateTransaction',
        'resetFxRates',
        'renameEnvelope',
        'restoreTransaction',
        'setAccountInBalance',
        'setEnvelopeColor',
        'setEnvelopeComment',
        'setEmojiIcons',
        'setPreferZmBudgets',
        'setReminder',
        'setBudget',
        'setGoal',
        'setTransactionsViewed',
        'TBudgetUpdate',
        'updateEnvelopeSettings',
      ].sort()
    )
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

  it('keeps app consumers off Core implementation subpaths', () => {
    const appRoot = dirname(coreRoot)
    const violations = walk(appRoot)
      .filter(file => {
        const path = relative(appRoot, file)
        return (
          /\.(?:ts|tsx)$/.test(path) &&
          !path.startsWith('core-next/') &&
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
            /from ['"]core-next\/(?:zenmoney|zerro|patch|tag-icons|materializer|adapters\/redux\/)/.test(
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
          .filter(({ line }) => /\b[A-Za-z]\w*Model\s*\./.test(line))
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
      !path.startsWith('adapters/') &&
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
