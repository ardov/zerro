import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse, wcagContrast, wcagLuminance } from 'culori'
import { expect, it, onTestFinished } from 'vitest'
import { themeTokensCss } from './colors'

const tailwind = readFileSync(
  resolve(process.cwd(), 'src/tailwind.css'),
  'utf8'
)
const tailwindDeclarations = new Set(
  [...tailwind.matchAll(/^\s*(--[\w-]+):/gm)].map(([, name]) => name)
)
const paletteReferences = new Set(
  [...tailwind.matchAll(/var\((--[\w-]+)\s*\)/g)]
    .map(([, name]) => name)
    .filter(name => !tailwindDeclarations.has(name))
)

it.each(['light', 'dark'])(
  'resolves the Tailwind palette to usable colors in %s mode',
  mode => {
    const root = document.documentElement
    const wasDark = root.classList.contains('dark')
    const stylesheet = document.createElement('style')
    stylesheet.textContent = themeTokensCss
    document.head.append(stylesheet)
    root.classList.toggle('dark', mode === 'dark')
    onTestFinished(() => {
      stylesheet.remove()
      root.classList.toggle('dark', wasDark)
    })

    const style = getComputedStyle(root)
    const unresolved = [...paletteReferences].filter(
      name => !parse(style.getPropertyValue(name).trim())
    )
    expect(unresolved).toEqual([])
    const background = style.getPropertyValue('--background')
    const foreground = style.getPropertyValue('--foreground')
    expect(wcagContrast(background, foreground)).toBeGreaterThanOrEqual(4.5)
    expect(wcagLuminance(background) > wcagLuminance(foreground)).toBe(
      mode === 'light'
    )
  }
)
