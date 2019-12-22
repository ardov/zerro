import React from 'react'
import { connect } from 'react-redux'
import { formatMoney } from 'helpers/format'
import { getTransfersOutsideBudget } from '../selectors/getTransfersOutsideBudget'
import { getUserCurrencyCode } from 'store/data/serverData'
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

function TransferTable({ transfers, currency, ...rest }) {
  const classes = useStyles()
  const formatSum = sum => formatMoney(sum, currency)

  const rows = transfers.map(account => ({
    id: account.id,
    name: account.title,
    fromBudget: formatSum(account.transfersFromBudget),
    toBudget: formatSum(account.transfersToBudget),
    total: formatSum(account.transfersToBudget - account.transfersFromBudget),
  }))

  return (
    <Paper className={classes.root}>
      <Box p={2} clone>
        <Typography variant="h6" id="tableTitle">
          Переводы из бюджета
        </Typography>
      </Box>
      <Table className={classes.table}>
        <TableHead>
          <TableRow>
            <TableCell>Счёт</TableCell>
            <TableCell align="right">Ушло из бюджета</TableCell>
            <TableCell align="right">Вернулось в бюджет</TableCell>
            <TableCell align="right">Итого</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.map(row => (
            <TableRow key={row.id} hover>
              <TableCell component="th" scope="row">
                {row.name}
              </TableCell>
              <TableCell align="right">{row.fromBudget}</TableCell>
              <TableCell align="right">{row.toBudget}</TableCell>
              <TableCell align="right">{row.total}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  )
}

const mapStateToProps = (state, { index }) => ({
  transfers: getTransfersOutsideBudget(state)[index],
  currency: getUserCurrencyCode(state),
})

export default connect(mapStateToProps, null)(TransferTable)
