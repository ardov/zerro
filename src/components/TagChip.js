import React from 'react'
import { connect } from 'react-redux'
import { getPopulatedTag } from 'store/localData/tags'
import { Chip } from '@material-ui/core'

function TagChip({ id, label, ...rest }) {
  return <Chip {...{ label, ...rest }} />
}

export default connect(
  (state, { id }) => {
    const tag = getPopulatedTag(state, id)
    return tag
      ? {
          label: tag.icon ? tag.symbol + ' ' + tag.name : tag.title,
        }
      : {}
  },
  () => ({})
)(TagChip)
