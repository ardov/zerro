import React from 'react'
import { connect } from 'react-redux'
import { Paper } from '@material-ui/core'
import { setOutcomeBudget } from '../../thunks'
import { getAmountsByTag } from '../../selectors/getAmountsByTag'
import { getUserCurrencyCode } from 'store/data/instruments'
import Row from './Row'

function TagTable({ tags, currency, date, updateBudget, ...rest }) {
  const filtered = tags
    .filter(tag => tag.showOutcome || tag.totalOutcome || tag.totalAvailable)
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <Paper>
      {filtered.map(tag => (
        <Row key={tag.id} {...tag} setBudget={updateBudget} date={date}></Row>
      ))}
    </Paper>
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
