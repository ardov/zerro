import type { TTagId } from '6-shared/types'
import { Box } from '@mui/material'

import type { FC, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { ChipProps } from '@mui/material'
import { Chip } from '@mui/material'
import { CloseIcon } from '6-shared/ui/Icons'
import { TagIcon } from '../../../6-shared/ui/TagIcon'
import { useAppSelector } from 'store'
import { core } from 'zerro-core/redux'

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
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <TagIcon symbol={tag.symbol} sx={{ ml: -1.5, mr: 0.5 }} />
        {tag.name}
      </Box>
    )
  return tag.title
}
