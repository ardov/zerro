import toArray from 'lodash/toArray'
import { int2rgb, int2hex, getColorForString } from '@shared/helpers/color'
import { sendEvent } from '@shared/helpers/tracking'
import { ByIdOld, TTag } from '@shared/types'
import tagIcons from '@shared/tagIcons.json'
import { TTagPopulated } from './types'
import { nullTag } from './makeTag'

export default function populateTags(rawTags: ByIdOld<TTag>) {
  let tags: {
    [x: string]: TTagPopulated
  } = { null: makePopulatedTag(nullTag) }
  let names: { [key: string]: number } = {}

  for (const id in rawTags) {
    // Add name, symbol and colorRGB
    const populated = makePopulatedTag(rawTags[id])
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

function makePopulatedTag(tag: TTag): TTagPopulated {
  return {
    ...tag,
    children: [],
    name: getName(tag.title),
    uniqueName: getName(tag.title),
    symbol: getSymbol(tag),
    colorRGB: int2rgb(tag.color),
    colorHEX: int2hex(tag.color),
    colorGenerated: getColorForString(tag.title),
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
function getSymbol(tag: TTag) {
  if (tag.id === 'null') return '?'
  if (tag.icon) {
    if (tagIcons[tag.icon]) {
      return tagIcons[tag.icon]
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
