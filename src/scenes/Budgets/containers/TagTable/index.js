import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'

import { Paper, Box } from '@material-ui/core'
import { setOutcomeBudget } from '../../thunks'
import { getAmountsByTag } from '../../selectors/getAmountsByTag'
import { getUserCurrencyCode } from 'store/data/instruments'
import Row from './Row'
import TagTableHeader from './TagTableHeader'
import TransactionsDrawer from 'components/TransactionsDrawer'
import { endOfMonth } from 'date-fns'
import sendEvent from 'helpers/sendEvent'

function TagTable({ tags, currency, date, updateBudget, ...rest }) {
  const [selected, setSelected] = useState()
  const filtered = tags
    .filter(tag => tag.showOutcome || tag.totalOutcome || tag.totalAvailable)
    .sort((a, b) => a.name.localeCompare(b.name))

  useEffect(() => {
    if (selected) sendEvent('Budgets: see transactions')
  }, [selected])

  const filterConditions = {
    type: 'outcome',
    dateFrom: date,
    dateTo: endOfMonth(date),
    tags: [selected],
  }

  return (
    <Box position="relative" py={1} clone>
      <Paper>
        <TransactionsDrawer
          filterConditions={filterConditions}
          open={!!selected || selected === null}
          onClose={() => setSelected(undefined)}
        />
        <TagTableHeader
          position="sticky"
          top={0}
          zIndex={2}
          bgcolor="background.paper"
        />
        {filtered.map(tag => (
          <Row
            key={tag.id}
            {...tag}
            setBudget={updateBudget}
            onSelect={id => setSelected(id)}
            date={date}
          ></Row>
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

export default connect(mapStateToProps, mapDispatchToProps)(TagTable)
