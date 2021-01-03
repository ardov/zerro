import React from 'react'
import { useSelector } from 'react-redux'
import {  getPopulatedTags } from 'store/localData/tags'
import { Chip, ChipTypeMap } from '@material-ui/core'
import CloseIcon from '@material-ui/icons/Close'
import { PopulatedTag, TagId } from 'types'

function getTagLabel(tag?: PopulatedTag) {
  if (!tag) return null
  if (tag.icon) return `${tag.symbol} ${tag.name}`
  return tag.title
}

interface TagChipProps extends ChipTypeMap {
  id: TagId
}

export default function TagChip({ id, ...rest }:TagChipProps) {
  let tag = useSelector(getPopulatedTags)[id]
  let label = getTagLabel(tag)
  if (id === 'mixed') label = 'Разные категории'
  return <Chip deleteIcon={<CloseIcon />} label={label} {...rest} />
}
