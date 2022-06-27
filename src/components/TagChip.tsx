import React, { FC } from 'react'
import { useAppSelector } from 'models'
import { getPopulatedTags } from 'models/tags'
import { Chip, ChipProps } from '@mui/material'
import { CloseIcon } from 'shared/ui/Icons'
import { TTagPopulated, TTagId } from 'shared/types'

function getTagLabel(tag?: TTagPopulated) {
  if (!tag) return null
  if (tag.icon) return `${tag.symbol} ${tag.name}`
  return tag.title
}

interface TagChipProps extends ChipProps {
  id: TTagId
}

const TagChip: FC<TagChipProps> = ({ id, ...rest }) => {
  let tag = useAppSelector(getPopulatedTags)[id]
  let label = getTagLabel(tag)
  if (id === 'mixed') label = 'Разные категории'
  return <Chip deleteIcon={<CloseIcon />} label={label} {...rest} />
}

export default TagChip
