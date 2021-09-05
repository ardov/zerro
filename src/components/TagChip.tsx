import React, { FC } from 'react'
import { useSelector } from 'react-redux'
import { getPopulatedTags } from 'store/localData/tags'
import { Chip, ChipProps } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { PopulatedTag, TagId } from 'types'

function getTagLabel(tag?: PopulatedTag) {
  if (!tag) return null
  if (tag.icon) return `${tag.symbol} ${tag.name}`
  return tag.title
}

interface TagChipProps extends ChipProps {
  id: TagId
}

const TagChip: FC<TagChipProps> = ({ id, ...rest }) => {
  let tag = useSelector(getPopulatedTags)[id]
  let label = getTagLabel(tag)
  if (id === 'mixed') label = 'Разные категории'
  return <Chip deleteIcon={<CloseIcon />} label={label} {...rest} />
}

export default TagChip
