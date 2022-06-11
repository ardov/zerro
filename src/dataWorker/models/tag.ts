import { TUserId } from './user'
import iconsMap from './iconsMap.json'
import { isoToUnix, TISOTimestamp, TUnixTime, unixToISO } from './common'
import { TFxCode } from './instrument'
import { Modify } from 'types'
import toArray from 'lodash/toArray'
import { getColorForString, int2hex, int2rgb } from 'helpers/color'

type TIconName = keyof typeof iconsMap

export type TTagId = string

export type TZmTag = {
  id: TTagId // UUID
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

export type TTag = Modify<
  TZmTag,
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

// Converter
export const convertTag = {
  toClient: (el: TZmTag): TTag => ({
    ...el,
    changed: unixToISO(el.changed),
    // Custom
    name: getName(el.title),
    uniqueName: getName(el.title), // temporary
    symbol: getSymbol(el), // Emoji
    children: [], // temporary
    colorRGB: int2rgb(el.color),
    colorHEX: int2hex(el.color),
    colorGenerated: getColorForString(el.title),
    // From hidden data (adds later)
    comment: null,
    currencyCode: null,
    group: null,
  }),
  toServer: (el: TTag): TZmTag => {
    const res = {
      ...el,
      changed: isoToUnix(el.changed),
      // Custom
      name: undefined,
      uniqueName: undefined,
      symbol: undefined,
      children: undefined,
      colorRGB: undefined,
      colorHEX: undefined,
      colorGenerated: undefined,
      // From hidden data
      comment: undefined,
      currencyCode: undefined,
      group: undefined,
    }
    delete res.name
    delete res.uniqueName
    delete res.symbol
    delete res.children
    delete res.colorRGB
    delete res.colorHEX
    delete res.colorGenerated
    delete res.comment
    delete res.currencyCode
    delete res.group
    return res
  },
}

// Helpers

function getName(title: string) {
  const titleArr = toArray(title)
  if (isEmoji(titleArr[0])) {
    titleArr.shift()
    return titleArr.join('').trim()
  } else {
    return title
  }
}

function getSymbol(tag: TZmTag) {
  if (tag.id === 'null') return '?'
  if (tag.icon) {
    if (iconsMap[tag.icon]) {
      return iconsMap[tag.icon]
    }
  }
  return tag.title.slice(0, 2)
}

function isEmoji(str: string) {
  const regex =
    /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|[\ud83c[\ude50\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g
  return str && str.match(regex)
}
