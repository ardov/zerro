import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/** MUI and Emotion are gone from both the app and development tooling. */
const IS_CODE = /\.(tsx?|jsx?|mdx)$/
const BANNED = /^@(mui|emotion)\//
const SPECIFIER =
  /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|import\s*['"]([^'"]+)['"]/g

/** Comments, so that a specifier written in prose is not read as an import.
 * This file's own subject gets discussed a lot in comments — a line that
 * records what a module used to import, or a doc block that names the package
 * a factory replaced, would otherwise fail the check for a package nothing
 * loads. Block comments go whole; line comments only when they start the line,
 * which is what a commented-out import looks like and leaves a `https://` in
 * the middle of a line alone. */
const stripComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '')

const specifiersIn = (source: string) =>
  [...stripComments(source).matchAll(SPECIFIER)].map(
    match => match[1] || match[2] || match[3]
  )

function filesIn(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap(entry => {
    const file = join(root, entry.name)
    if (entry.isDirectory()) return filesIn(file)
    return IS_CODE.test(file) ? [file] : []
  })
}

const ROOTS = ['src', 'stories', '.storybook', 'tools']
const files = ROOTS.flatMap(root => filesIn(resolve(process.cwd(), root)))
const banned = files.flatMap(file =>
  specifiersIn(readFileSync(file, 'utf8'))
    .filter(specifier => BANNED.test(specifier))
    .map(specifier => `${file.replace(`${process.cwd()}/`, '')}: ${specifier}`)
)
const packageJson = JSON.parse(
  readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')
) as {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

describe('the application stays off MUI and Emotion', () => {
  it('contains no MUI or Emotion specifier in application or tooling code', () => {
    expect(banned).toEqual([])
  })

  it('declares neither package', () => {
    expect(
      Object.keys({
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      }).filter(name => BANNED.test(name))
    ).toEqual([])
  })

  it('reads an import, not a mention of one', () => {
    // The stripper is what stands between this check and a false failure on a
    // comment, so it is exercised directly rather than trusted.
    expect(
      specifiersIn(`// import x from '@${'mui/material'}'\nimport y from './y'`)
    ).toEqual(['./y'])
    expect(
      specifiersIn(
        `/** was: import x from '@${'emotion/react'}' */\nimport y from './y'`
      )
    ).toEqual(['./y'])
  })

  it('scans the intended source trees', () => {
    expect(files.length).toBeGreaterThan(300)
  })
})
