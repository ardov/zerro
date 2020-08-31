import React from 'react'
import { useSelector } from 'react-redux'
import { getPopulatedTag } from 'store/localData/tags'
import { Chip } from '@material-ui/core'
import CloseIcon from '@material-ui/icons/Close'

function getTagLabel(state, id) {
  const tag = getPopulatedTag(state, id)
  if (!tag) return null
  if (tag.icon) return `${tag.symbol} ${tag.name}`
  return tag.title
}

export default function TagChip({ id, ...rest }) {
  const label = useSelector(state => getTagLabel(state, id))
  return <Chip deleteIcon={<CloseIcon />} label={label} {...rest} />
}
