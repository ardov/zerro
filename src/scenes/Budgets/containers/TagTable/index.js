import React from 'react'
import { connect } from 'react-redux'

import { Paper, Typography, Box } from '@material-ui/core'
import { setOutcomeBudget } from '../../thunks'
import { getAmountsByTag } from '../../selectors/getAmountsByTag'
import { getUserCurrencyCode } from 'store/data/instruments'
import Row from './Row'
import TagTableHeader from './TagTableHeader'

function TagTable({ tags, currency, date, updateBudget, ...rest }) {
  const filtered = tags
    .filter(tag => tag.showOutcome || tag.totalOutcome || tag.totalAvailable)
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <Box position="relative" py={1} clone>
      <Paper>
        <Box p={2} clone>
          <Typography variant="h5">Бюджеты</Typography>
        </Box>
        <TagTableHeader
          position="sticky"
          top={48}
          zIndex={2}
          bgcolor="background.paper"
        />
        {filtered.map(tag => (
          <Row key={tag.id} {...tag} setBudget={updateBudget} date={date}></Row>
        ))}
      </Paper>
    </Box>
  )
}

const mapStateToProps = (state, { index }) => ({
  tags: getAmountsByTag(state)[index],
  currency: getUserCurrencyCode(state),
})

const mapDispatchToProps = dispatch => ({
  updateBudget: (outcome, month, tagId) =>
    dispatch(setOutcomeBudget(outcome, month, tagId)),
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TagTable)
