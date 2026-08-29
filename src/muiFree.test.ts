import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/** The application no longer uses MUI or Emotion, and this walks the whole
 * module graph from the browser entry point to keep it that way.
 *
 * It replaced a hand-maintained list of converted files, which could only say
 * that a named file was clean and needed a new line for every one that was.
 * The graph answers the question that actually matters — can anything the
 * application ships reach MUI — without being told what to look at.
 *
 * Storybook is deliberately outside it: `.storybook/StoryProviders.tsx` mounts
 * MUI's cascade provider and reference theme, and the parity stories render
 * MUI components beside the owned ones that replaced them. None of that is
 * reachable from here, which is the point of mounting it there. */
const ENTRY = 'src/index.tsx'

const SRC = resolve(process.cwd(), 'src')
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mdx']
const IS_CODE = /\.(tsx?|jsx?|mdx)$/
const BANNED = /^@(mui|emotion)\//
const SPECIFIER =
  /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|import\s*['"]([^'"]+)['"]/g

/** Bare specifiers resolve against `src` because tsconfig maps `*` there. A
 * package that is not vendored in `src` simply fails to resolve, which is the
 * right answer: the walk only follows this repository's own modules. */
function resolveModule(specifier: string, from: string) {
  const base = specifier.startsWith('.')
    ? resolve(dirname(from), specifier)
    : join(SRC, specifier)
  if (existsSync(base) && statSync(base).isFile()) {
    return IS_CODE.test(base) ? base : null
  }
  for (const extension of EXTENSIONS) {
    if (existsSync(base + extension)) return base + extension
  }
  for (const extension of EXTENSIONS) {
    const index = join(base, `index${extension}`)
    if (existsSync(index)) return index
  }
  return null
}

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

const specifiersOf = (file: string) => specifiersIn(readFileSync(file, 'utf8'))

const relative = (file: string) => file.replace(`${process.cwd()}/`, '')

/** Every banned specifier reachable from `entry`, each with the import chain
 * that reaches it, so a failure names the file to fix rather than the package. */
function findBanned(entry: string) {
  const seen = new Set<string>()
  const found: string[] = []

  const walk = (file: string, trail: string[]) => {
    if (seen.has(file)) return
    seen.add(file)
    for (const specifier of specifiersOf(file)) {
      if (BANNED.test(specifier)) {
        found.push(
          `${specifier} via ${[...trail, relative(file)].join(' -> ')}`
        )
        continue
      }
      const target = resolveModule(specifier, file)
      if (target) walk(target, [...trail, relative(file)])
    }
  }

  walk(resolve(process.cwd(), entry), [])
  return { found, reached: seen.size }
}

describe('the application stays off MUI and Emotion', () => {
  const { found, reached } = findBanned(ENTRY)

  it('reaches neither package from the entry point, however deep', () => {
    expect(found).toEqual([])
  })

  it('reads an import, not a mention of one', () => {
    // The stripper is what stands between this check and a false failure on a
    // comment, so it is exercised directly rather than trusted.
    expect(
      specifiersIn("// import x from '@mui/material'\nimport y from './y'")
    ).toEqual(['./y'])
    expect(
      specifiersIn(
        "/** was: import x from '@emotion/react' */\nimport y from './y'"
      )
    ).toEqual(['./y'])
  })

  it('walked a graph large enough to mean something', () => {
    // A resolver that quietly stopped following imports would pass the check
    // above while proving nothing. The application is several hundred modules.
    expect(reached).toBeGreaterThan(300)
  })
})
