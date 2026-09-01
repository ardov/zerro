import type { TTagId } from '@/6-shared/types'

import type { FC, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { ChipProps } from '@/6-shared/ui/Chip'
import { Chip } from '@/6-shared/ui/Chip'
import { CloseIcon } from '@/6-shared/ui/Icons'
import { TagIcon } from '../../../6-shared/ui/TagIcon'
import { useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'

export const TagChip: FC<ChipProps & { id: TTagId }> = ({ id, ...rest }) => {
  const { t } = useTranslation()
  const tag = useAppSelector(core.tags.selectPopulated)[id]
  const label = id === 'mixed' ? t('mixedCategories') : getTagLabel(tag)
  return <Chip deleteIcon={<CloseIcon />} label={label} {...rest} />
}

function getTagLabel(tag?: core.tags.TTagPopulated): ReactNode {
  if (!tag) return null
  if (tag.icon)
    return (
      <span className="flex items-center">
        <TagIcon symbol={tag.symbol} className="-ml-3 mr-1" />
        {tag.name}
      </span>
    )
  return tag.title
}
