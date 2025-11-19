import type { TTagId } from '6-shared/types'
import { Box } from '@mui/material'

import { FC, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Chip, ChipProps } from '@mui/material'
import { CloseIcon } from '6-shared/ui/Icons'
import { TagIcon } from '../../../6-shared/ui/TagIcon'
import { tagModel, TTagPopulated } from '../model'

export const TagChip: FC<ChipProps & { id: TTagId }> = ({ id, ...rest }) => {
  const { t } = useTranslation()
  let tag = tagModel.usePopulatedTags()[id]
  const label = id === 'mixed' ? t('mixedCategories') : getTagLabel(tag)
  return <Chip deleteIcon={<CloseIcon />} label={label} {...rest} />
}

function getTagLabel(tag?: TTagPopulated): ReactNode {
  if (!tag) return null
  if (tag.icon)
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <TagIcon
          symbol={tag.symbol}
          ml={-1.5}
          mr={0.5}
        />
        {tag.name}
      </Box>
    )
  return tag.title
}
