import { UserId } from './User'
import iconsMap from 'store/data/tags/iconsMap.json'
import { TUnixTime } from './common'
import { TFxCode } from './Instrument'
import { Modify } from '../ts-utils'
type IconName = keyof typeof iconsMap

export type TagId = string

export type ZmTag = {
  id: TagId // UUID
  changed: TUnixTime
  user: UserId
  title: string
  parent: TagId | null
  icon: IconName | null
  picture: string | null
  color: number | null
  showIncome: boolean
  showOutcome: boolean
  budgetIncome: boolean
  budgetOutcome: boolean
  required: boolean | null
}

export type TTag = Modify<
  ZmTag,
  {
    // Converted
    changed: TISOTimestamp

    // Custom
    name: string // Tag name without emoji
    uniqueName: string // If name not unique adds parent name
    symbol: string // Emoji
    children: string[]
    colorRGB: string | null
    colorHEX: string | null
    colorGenerated: string // Color generated from name

    // From hidden data
    comment: string | null
    currencyCode: TFxCode | null
    group: string | null
  }
>
