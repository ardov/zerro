import React from 'react'
import { connect } from 'react-redux'
import { getPopulatedTag } from 'store/localData/tags'
import { Chip } from '@material-ui/core'

const TagChip = ({ id, label, ...rest }) => <Chip label={label} {...rest} />

export default connect(
  (state, { id }) => {
    const tag = getPopulatedTag(state, id)
    if (tag)
      return { label: tag.icon ? `${tag.symbol} ${tag.name}` : tag.title }
    else return null
  },
  () => ({})
)(TagChip)
