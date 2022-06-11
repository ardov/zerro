import { TTagId, TZmTag } from 'types'
import { ById, TTag } from '../types'
import { unixToISO } from './utils'
import iconsMap from './iconsMap.json'
import { sendEvent } from 'helpers/tracking'
import toArray from 'lodash/toArray'
import { getColorForString, int2hex, int2rgb } from 'helpers/color'
import { dataDomain } from './domain'

// Events
export const setRawTags = dataDomain.createEvent<TZmTag[]>()

// Store
export const $rawTags = dataDomain.createStore<TZmTag[]>([], {
  name: '$rawTags',
})
$rawTags.on(setRawTags, (_, rawTags) => rawTags)

// Derivatives
export const $tags = $rawTags.map(tags => {
  let childrenMap: { [key: TTagId]: TTagId[] } = {}
  let names: { [key: string]: number } = {}
  let result: ById<TTag> = {}

  tags.forEach(tag => {
    // Fill children map
    if (tag.parent) {
      if (!childrenMap[tag.parent]) childrenMap[tag.parent] = []
      childrenMap[tag.parent].push(tag.id)
    }
    // Fill names
    names[tag.title] = names[tag.title] ? names[tag.title] + 1 : 1
    // Create drafts
    result[tag.id] = convertTag(tag)
  })

  for (const id in result) {
    const tag = result[id]
    // Add children
    if (childrenMap[id]) {
      tag.children = childrenMap[id]
    }
    // Add unique name
    if (names[tag.title] > 1 && tag.parent) {
      const parentName = result[tag.parent].name
      tag.uniqueName = `${parentName} / ${tag.name}`
    }
  }
  return result
})

// -----------------------------------------------------------------------------
// Functions
// -----------------------------------------------------------------------------

//** Converts Zm format to local */
function convertTag(raw: TZmTag): TTag {
  return {
    ...raw,
    changed: unixToISO(raw.changed),

    // Custom
    name: getName(raw.title),
    uniqueName: getName(raw.title), // temporary
    symbol: getSymbol(raw), // Emoji
    children: [], // temporary
    colorRGB: int2rgb(raw.color),
    colorHEX: int2hex(raw.color),
    colorGenerated: getColorForString(raw.title),

    // From hidden data (adds later)
    comment: null,
    currencyCode: null,
    group: null,
  }
}

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
    } else {
      sendEvent('Tags: UnknownNames: ' + tag.icon)
    }
  }
  return tag.title.slice(0, 2)
}

function isEmoji(str: string) {
  const regex =
    /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|[\ud83c[\ude50\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g
  return str && str.match(regex)
}
