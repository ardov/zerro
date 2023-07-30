import { TFxCode, TTag, TTagId } from '6-shared/types'

export type TTagPopulated = TTag & {
  name: string // Tag name without emoji
  uniqueName: string // If name not unique adds parent name
  symbol: string // Emoji
  children: TTagId[]
  colorRGB: string | null
  colorHEX: string | null
  colorGenerated: string // Color generated from name
  // From hidden data
  comment?: string | null
  currencyCode?: TFxCode | null
  group?: string | null
}
