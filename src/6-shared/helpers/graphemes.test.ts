import { describe, expect, it } from 'vitest'
import { toGraphemes } from './graphemes'

describe('toGraphemes', () => {
  it('splits plain text by character', () => {
    expect(toGraphemes('Еда')).toEqual(['Е', 'д', 'а'])
    expect(toGraphemes('')).toEqual([])
  })

  it('keeps multi-code-point emoji whole', () => {
    expect(toGraphemes('🇷🇺 Россия')[0]).toBe('🇷🇺')
    expect(toGraphemes('👨‍👩‍👧 Семья')[0]).toBe('👨‍👩‍👧')
    expect(toGraphemes('❤️ Любовь')[0]).toBe('❤️')
  })
})
