import { describe, expect, it } from 'vitest'
import { toGraphemes } from './graphemes'

describe('toGraphemes', () => {
  it('splits plain text by character', () => {
    expect(toGraphemes('Еда')).toEqual(['Е', 'д', 'а'])
    expect(toGraphemes('')).toEqual([])
  })

  it('keeps a simple emoji whole', () => {
    expect(toGraphemes('🍎 Еда')[0]).toBe('🍎')
  })

  it('keeps multi-code-point emoji whole', () => {
    // Splitting these by code point is what Array.from would get wrong.
    expect(toGraphemes('🇷🇺 Россия')[0]).toBe('🇷🇺')
    expect(toGraphemes('👨‍👩‍👧 Семья')[0]).toBe('👨‍👩‍👧')
    expect(toGraphemes('❤️ Любовь')[0]).toBe('❤️')
  })

  it('rejoins into the original string', () => {
    const title = '👨‍👩‍👧 Семья и 🇷🇺 дом'
    expect(toGraphemes(title).join('')).toBe(title)
  })
})
