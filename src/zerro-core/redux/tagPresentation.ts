import type { ById, TFxCode } from '6-shared/types'
import noCategoryIconUrl from '6-shared/icons/no_category-icon.svg'
import { tagIconsSvg } from '6-shared/tagIconsSvg'
import { t } from 'i18next'
import toArray from 'lodash/toArray'
import {
  buildTagStructure,
  getColorForString,
  getTagName,
  TTag,
  TTagStructure,
} from '../domain/zenmoney'
import { getTagIconEmoji } from '../presentation/tag-icons'

export type TTagPopulated = TTagStructure & {
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

export function populateTags(
  rawTags: ById<TTag>,
  userSettings: TTagPresentationSettings
): ById<TTagPopulated> {
  const structure = buildTagStructure({
    tags: rawTags,
  })

  return presentTags(structure, userSettings)
}

export function presentTags(
  structure: ById<TTagStructure>,
  userSettings: TTagPresentationSettings
): ById<TTagPopulated> {
  const nullTagStructure = buildTagStructure({
    tags: {},
    extraTags: { null: nullTag },
  }).null
  const populated: ById<TTagPopulated> = {}

  for (const id in { null: nullTagStructure, ...structure }) {
    const tag = id === 'null' ? nullTagStructure : structure[id]
    const colorGenerated = getColorForString(tag.title)
    populated[id] = {
      ...tag,
      symbol: getSymbol(tag, userSettings),
      colorHEX: tag.colorHex,
      colorGenerated,
      colorDisplay: tag.colorHex || colorGenerated,
    }
  }

  return populated
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
