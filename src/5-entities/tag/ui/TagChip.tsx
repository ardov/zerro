import type { TTagId } from '6-shared/types'
import React, { FC } from 'react'
import { Chip, ChipProps } from '@mui/material'
import { CloseIcon } from '6-shared/ui/Icons'
import { tagModel, TTagPopulated } from '../model'

export const TagChip: FC<ChipProps & { id: TTagId }> = ({ id, ...rest }) => {
  let tag = tagModel.usePopulatedTags()[id]
  let label = getTagLabel(tag)
  if (id === 'mixed') label = 'Разные категории'
  return <Chip deleteIcon={<CloseIcon />} label={label} {...rest} />
}

function getTagLabel(tag?: TTagPopulated) {
  if (!tag) return null
  if (tag.icon) return `${tag.symbol} ${tag.name}`
  return tag.title
}
