import React, { FC } from 'react'
import { Chip, ChipProps } from '@mui/material'
import { CloseIcon } from '6-shared/ui/Icons'
import { TTagId } from '6-shared/types'
import { tagModel, TTagPopulated } from '5-entities/tag'

function getTagLabel(tag?: TTagPopulated) {
  if (!tag) return null
  if (tag.icon) return `${tag.symbol} ${tag.name}`
  return tag.title
}

interface TagChipProps extends ChipProps {
  id: TTagId
}

const TagChip: FC<TagChipProps> = ({ id, ...rest }) => {
  let tag = tagModel.usePopulatedTags()[id]
  let label = getTagLabel(tag)
  if (id === 'mixed') label = 'Разные категории'
  return <Chip deleteIcon={<CloseIcon />} label={label} {...rest} />
}

export default TagChip
