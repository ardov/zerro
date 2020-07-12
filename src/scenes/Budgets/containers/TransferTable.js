import React from 'react'
import { connect } from 'react-redux'
import { formatMoney } from 'helpers/format'
import { getUserCurrencyCode } from 'store/serverData'
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
import TagSelect2 from 'components/TagSelect2'
import {
  addConnection,
  getAccTagMap,
} from 'store/localData/hiddenData/accTagMap'
import { getTransfers } from '../selectors/getAmountsByTag'
import { getAccounts } from 'store/localData/accounts'
import TagChip from 'components/TagChip'

const useStyles = makeStyles(theme => ({
  root: {
    width: '100%',
    marginTop: theme.spacing(3),
    overflowX: 'auto',
  },
  head: { position: 'sticky', top: 0 },
}))

function TransferTable({
  transfers,
  accounts,
  currency,
  accTagMap,
  connectToTag,
  ...rest
}) {
  const classes = useStyles()
  const formatSum = sum =>
    sum > 0 ? '+' + formatMoney(sum, currency) : formatMoney(sum, currency)

  const rows = []
  for (const accId in transfers) {
    rows.push({
      id: accId,
      name: accounts[accId] && accounts[accId].title,
      total: formatSum(-transfers[accId]),
    })
  }

  return rows.length ? (
    <Paper className={classes.root}>
      <Box p={2} clone>
        <Typography variant="h6" id="tableTitle">
          Переводы из бюджета
        </Typography>
      </Box>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Счёт</TableCell>
            <TableCell align="right">Сумма переводов</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.map(row => (
            <TableRow key={row.id} hover>
              <TableCell component="th" scope="row">
                <TagSelect2
                  trigger={
                    <span>
                      {row.name}
                      {accTagMap[row.id] && (
                        <Box ml={1} clone>
                          <TagChip
                            id={accTagMap[row.id]}
                            onDelete={() => connectToTag(row.id, null)}
                          />
                        </Box>
                      )}
                    </span>
                  }
                  onChange={id => connectToTag(row.id, id)}
                />
              </TableCell>
              <TableCell align="right">{row.total}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  ) : null
}

const mapStateToProps = (state, { month }) => ({
  transfers: getTransfers(state)[month],
  accounts: getAccounts(state),
  currency: getUserCurrencyCode(state),
  accTagMap: getAccTagMap(state),
})

const mapDispatchToProps = dispatch => ({
  connectToTag: (account, tag) => dispatch(addConnection(account, tag)),
})

export default connect(mapStateToProps, mapDispatchToProps)(TransferTable)
