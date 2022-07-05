import { TFxCode } from 'models/instrument'
import { TUserId } from 'models/user'
import { Modify, TMsTime, TUnixTime } from 'shared/types'
import iconsMap from './iconsMap.json'

export type TTagId = string
type TIconName = keyof typeof iconsMap

export type TZmTag = {
  id: TTagId
  changed: TUnixTime
  user: TUserId
  title: string
  parent: TTagId | null
  icon: TIconName | null
  picture: string | null
  color: number | null
  showIncome: boolean
  showOutcome: boolean
  budgetIncome: boolean
  budgetOutcome: boolean
  required: boolean | null
}

export type TTag = Modify<TZmTag, { changed: TMsTime }>

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
