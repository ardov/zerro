const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })

/**
 * Splits a string into user-perceived characters.
 *
 * Category titles routinely start with an emoji, and emoji are rarely a
 * single code point: flags are regional indicator pairs, families are joined
 * with ZWJ, and hearts carry a variation selector. Splitting by code point
 * would cut all of those in half, so segment by grapheme cluster instead.
 */
export function toGraphemes(str: string): string[] {
  return Array.from(segmenter.segment(str), segment => segment.segment)
}
