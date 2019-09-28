import React from 'react'
import styled from 'styled-components'
import { connect } from 'react-redux'
import debounce from 'lodash/debounce'

import { formatMoney } from 'helpers/format'
import { setOutcomeBudget } from '../thunks'
import BudgetCell from './BudgetCell'
import { getAmountsByTag } from '../selectors/getAmountsByTag'
import { getUserCurrencyCode } from 'store/data/instruments'
import { makeStyles } from '@material-ui/core/styles'
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@material-ui/core'

const useStyles = makeStyles(theme => ({
  root: {
    width: '100%',
    marginTop: theme.spacing(3),
    overflowX: 'auto',
  },
  table: { minWidth: 600 },
  head: { position: 'sticky', top: 0 },
}))

const colorMap = {
  positive: 'var(--text-success)',
  negative: 'var(--color-danger)',
  neutral: 'var(--text-placeholder)',
}

const Available = styled.span`
  color: ${props => colorMap[props.displayType]};
`
const Outcome = styled.span`
  color: ${props =>
    props.value === 0 ? 'var(--text-placeholder)' : 'var(--text-primary)'};
`

function TagTable({ tags, currency, date, updateBudget, ...rest }) {
  const classes = useStyles()
  const formatSum = sum => formatMoney(sum, currency)

  const rows = tags
    .filter(tag => tag.showOutcome || tag.totalOutcome || tag.totalAvailable)
    .map(tag => ({
      id: tag.id,
      name: tag.title,
      budgeted: tag.totalBudgeted,
      available: tag.totalAvailable,
      isChild: false,
      date,
      updateBudget,
      hasOverspent: !!tag.overspent,
      outcome: tag.totalOutcome,
      children: getChildren({
        tag,
        date,
        updateBudget,
        hasOverspent: !!tag.overspent,
      }),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <Paper className={classes.root}>
      <Box p={2} clone>
        <Typography variant="h6" id="tableTitle">
          Бюджеты
        </Typography>
      </Box>
      <Table className={classes.table} stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Категория</TableCell>
            <TableCell align="right">Бюджет</TableCell>
            <TableCell align="right">Потрачено</TableCell>
            <TableCell align="right">Остаток</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.map(row => (
            <TableRow key={row.id} hover>
              <TableCell component="th" scope="row">
                {row.name}
              </TableCell>
              <TableCell align="right">
                <BudgetCell
                  id={row.id}
                  budgeted={row.budgeted}
                  available={row.available}
                  key={row.id + row.budgeted}
                  date={date}
                  isChild={row.isChild}
                  onUpdate={debounce(updateBudget, 2000)}
                />
              </TableCell>
              <TableCell align="right">
                <Outcome value={row.outcome}>{formatSum(row.outcome)}</Outcome>
              </TableCell>
              <TableCell align="right">
                <Available
                  displayType={getAvailableColor({
                    value: row.available,
                    hasOverspent: row.hasOverspent,
                    isChild: row.isChild,
                    hasBudget: row.hasBudget,
                  })}
                >
                  {formatSum(row.available)}
                </Available>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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

function getAvailableColor({ value, hasOverspent, isChild, hasBudget }) {
  if (!isChild || hasBudget) {
    return value === 0 ? 'neutral' : value < 0 ? 'negative' : 'positive'
  } else {
    return value > 0
      ? 'positive'
      : value === 0
      ? 'neutral'
      : hasOverspent
      ? 'negative'
      : 'neutral'
  }
}

function getChildren({ tag, date, updateBudget, hasOverspent }) {
  const children = tag.children.length
    ? tag.children
        .filter(
          child =>
            child.showOutcome || child.totalOutcome || child.totalAvailable
        )
        .map(child => ({
          key: child.id,
          name: child.title,
          budgeted: {
            date,
            updateBudget,
            tag,
            id: child.id,
            budgeted: child.budgeted,
            available: child.available,
            isChild: true,
          },
          available: {
            value: child.available,
            hasOverspent,
            isChild: true,
            hasBudget: !!child.budgeted,
          },
          outcome: child.outcome,
        }))
    : null
  return children && tag.outcome
    ? [
        {
          key: tag.id + '-unsorted',
          name: 'Без подкатегории',
          budgeted: {
            updateBudget: () => {},
            date,
            id: tag.id,
            budgeted: 0,
            available: 0,
            isChild: true,
          },
          available: {
            value: -tag.outcome,
            hasOverspent,
            isChild: true,
            hasBudget: false,
          },
          outcome: tag.outcome,
        },
        ...children,
      ]
    : children
}
