import emojis from './emojis.json'

export type TTagIconId = keyof typeof emojis

export type TTagIcon = {
  id: string
  emoji: string | null
  svg: string | null
}

export type TTagIconCatalogOptions = {
  svgById?: Record<string, string>
}

const emojiById: Record<string, string> = emojis

export function createTagIconCatalog(
  options: TTagIconCatalogOptions = {}
): Record<string, TTagIcon> {
  const ids = new Set([
    ...Object.keys(emojiById),
    ...Object.keys(options.svgById || {}),
  ])

  return Object.fromEntries(
    Array.from(ids)
      .sort()
      .map(id => [id, getTagIcon(id, options)!])
  )
}

export function getTagIcon(
  id: string | null | undefined,
  options: TTagIconCatalogOptions = {}
): TTagIcon | null {
  if (!id) return null
  return {
    id,
    emoji: getTagIconEmoji(id),
    svg: getTagIconSvg(id, options),
  }
}

export function getTagIconEmoji(id: string | null | undefined): string | null {
  if (!id) return null
  return emojiById[id] || null
}

export function getTagIconSvg(
  id: string | null | undefined,
  options: TTagIconCatalogOptions = {}
): string | null {
  if (!id) return null
  return options.svgById?.[id] || null
}
