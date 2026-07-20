import type { ById, TFxCode } from '6-shared/types'
import noCategoryIconUrl from '6-shared/icons/no_category-icon.svg'
import { tagIconsSvg } from '6-shared/tagIconsSvg'
import { t } from 'i18next'
import toArray from 'lodash/toArray'
import type { TTag, TTagId } from '../../internal/domain/zenmoney/entities/tags'
import { int2hex } from '../../internal/domain/zenmoney/model/color'
import { getColorForString } from '../presentation/colors'
import { getTagIconEmoji } from '../presentation/tag-icons'

export type TTagPopulated = TTag & {
  name: string
  uniqueName: string
  children: TTagId[]
  symbol: string
  colorHEX: string | null
  colorGenerated: string
  colorDisplay: string
  comment?: string | null
  currencyCode?: TFxCode | null
  group?: string | null
}

type TTagPresentationSettings = Pick<TUserSettings, 'emojiIcons'>
type TUserSettings = { emojiIcons: boolean }

export const nullTag: TTag = {
  id: 'null',
  changed: 0,
  user: 0,
  title: t('common:tagNull'),
  icon: null,
  budgetIncome: true,
  budgetOutcome: true,
  archive: false,
  showIncome: false,
  showOutcome: false,
  parent: null,
  color: null,
  required: false,
  staticId: null,
  picture: null,
}

export function presentTags(
  rawTags: ById<TTag>,
  userSettings: TTagPresentationSettings
): ById<TTagPopulated> {
  const names: Record<string, number> = {}
  const populated: ById<TTagPopulated> = {}
  const tags: ById<TTag> = { ...rawTags, null: nullTag }

  Object.values(rawTags).forEach(tag => {
    const name = getTagName(tag.title)
    names[name] = (names[name] || 0) + 1
  })

  for (const id in tags) {
    const tag = tags[id]
    const name = getTagName(tag.title)
    const colorHEX = int2hex(tag.color)
    const colorGenerated = getColorForString(tag.title)
    populated[id] = {
      ...tag,
      name,
      uniqueName: name,
      children: [],
      symbol: getSymbol(tag, userSettings),
      colorHEX,
      colorGenerated,
      colorDisplay: colorHEX || colorGenerated,
    }
  }

  Object.values(populated).forEach(tag => {
    if (!tag.parent) return

    const parent = populated[tag.parent]
    if (!parent) return
    parent.children.push(tag.id)
    if (names[tag.name] > 1) {
      tag.uniqueName = `${parent.name} / ${tag.name}`
    }
  })

  return populated
}

function getTagName(title: string): string {
  const titleArr = toArray(title)
  if (isEmoji(titleArr[0])) {
    titleArr.shift()
    return titleArr.join('').trim()
  }
  return title
}

function getSymbol(tag: TTag, userSettings: TTagPresentationSettings) {
  const useSvgIcons = !userSettings.emojiIcons
  if (tag.id === 'null') {
    return useSvgIcons ? noCategoryIconUrl : '?'
  }
  if (tag.icon) {
    if (useSvgIcons && tagIconsSvg[tag.icon]) {
      return tagIconsSvg[tag.icon]
    }
    const emoji = getTagIconEmoji(tag.icon)
    if (!useSvgIcons && emoji) {
      return emoji
    }
  }
  const titleArr = toArray(tag.title)
  if (getTagName(tag.title) !== tag.title) return titleArr[0]
  return (titleArr[0] + titleArr[1]).trim() || '?'
}

function isEmoji(str: string) {
  const regex =
    /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|[\ud83c[\ude50\ude3a]|\ud83c[\ude50\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g
  return Boolean(str && str.match(regex))
}
