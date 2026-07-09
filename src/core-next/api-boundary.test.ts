import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const coreRoot = dirname(fileURLToPath(import.meta.url))

describe('core-next API boundary', () => {
  it('keeps the root entrypoint facade-only', () => {
    const rootIndex = readFileSync(join(coreRoot, 'index.ts'), 'utf8')

    expect(rootIndex).not.toMatch(/from ['"]\.\/(?:zenmoney|zerro|adapters)/)
  })

  it('keeps production core free from app runtime imports', () => {
    const violations = readProductionCoreFiles()
      .flatMap(file => {
        const source = readFileSync(file, 'utf8')
        return source
          .split('\n')
          .map((line, index) => ({ line, index }))
          .filter(({ line }) =>
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
    const violations = readProductionCoreFiles()
      .flatMap(file => {
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
