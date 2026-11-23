const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })

export function toGraphemes(str: string): string[] {
  return Array.from(segmenter.segment(str), segment => segment.segment)
}
