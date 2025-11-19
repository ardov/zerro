import type { ById, TFxCode, TTag, TTagId } from '6-shared/types'

import toArray from 'lodash/toArray'
import { int2hex, getColorForString } from '6-shared/helpers/color'
import { sendEvent } from '6-shared/helpers/tracking'
import tagIcons from '6-shared/tagIcons.json'
import noCategoryIconUrl from '6-shared/icons/no_category-icon.svg'
import { TUserSettings } from '5-entities/userSettings/userSettings'
import { tagIconsSvg } from '6-shared/tagIconsSvg'
import { nullTag } from './makeTag'

export type TTagPopulated = TTag & {
  name: string // Tag name without emoji
  uniqueName: string // If name not unique adds parent name
  symbol: string // Emoji string or SVG URL
  children: TTagId[]
  colorHEX: string | null
  colorGenerated: string // Color generated from name
  colorDisplay: string // Color to display
  // From hidden data
  comment?: string | null
  currencyCode?: TFxCode | null
  group?: string | null
}

export function populateTags(rawTags: ById<TTag>, userSettings: TUserSettings) {
  let tags: {
    [x: string]: TTagPopulated
  } = { null: makePopulatedTag(nullTag, userSettings) }
  let names: { [key: string]: number } = {}

  for (const id in rawTags) {
    // Add name, symbol and colorHEX
    const populated = makePopulatedTag(rawTags[id], userSettings)
    tags[id] = populated
    let name = populated.name
    names[name] = names[name] ? names[name] + 1 : 1
  }

  for (const id in tags) {
    const parentId = tags[id].parent
    if (parentId) {
      // Populate children array with ids
      tags[parentId].children.push(id)
      // Populate uniqueName if name is not unique
      if (names[tags[id].name] > 1) {
        tags[id].uniqueName = tags[parentId].name + ' / ' + tags[id].name
      }
    }
  }

  return tags
}

function makePopulatedTag(
  tag: TTag,
  userSettings: TUserSettings
): TTagPopulated {
  const colorHEX = int2hex(tag.color)
  const colorGenerated = getColorForString(tag.title)
  return {
    ...tag,
    children: [],
    name: getName(tag.title),
    uniqueName: getName(tag.title),
    symbol: getSymbol(tag, userSettings),
    colorHEX,
    colorGenerated,
    colorDisplay: colorHEX || colorGenerated,
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

function getSymbol(tag: TTag, userSettings: TUserSettings) {
  const useSvgIcons = !userSettings.emojiIcons
  if (tag.id === 'null') {
    return useSvgIcons ? noCategoryIconUrl : '?'
  }
  if (tag.icon) {
    if (useSvgIcons && tagIconsSvg[tag.icon]) {
      return tagIconsSvg[tag.icon]
    }
    if (!useSvgIcons && tagIcons[tag.icon]) {
      return tagIcons[tag.icon]
    }
    sendEvent('Tags: UnknownNames: ' + tag.icon)
  }
  const titleArr = toArray(tag.title)
  if (isEmoji(titleArr[0])) return titleArr[0]
  return (titleArr[0] + titleArr[1]).trim() || '?'
}

function isEmoji(str: string) {
  const regex =
    /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|[\ud83c[\ude50\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g
  return str && str.match(regex)
}
