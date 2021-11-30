import React, { FC } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { formatMoney } from 'helpers/format'
import { getUserCurrencyCode } from 'store/data/instruments'
import { makeStyles } from '@mui/styles'
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  PaperProps,
} from '@mui/material'
import TagSelect2 from 'components/TagSelect2'
import { addConnection, getAccTagMap } from 'store/data/hiddenData/accTagMap'
import { getTransfers } from '../selectors'
import { getAccounts } from 'store/data/accounts'
import TagChip from 'components/TagChip'
import { useMonth } from '../pathHooks'

const useStyles = makeStyles(theme => ({
  root: {
    width: '100%',
    overflowX: 'auto',
  },
  head: { position: 'sticky', top: 0 },
}))

export const TransferTable: FC<PaperProps> = ({ className, ...rest }) => {
  const [month] = useMonth()
  const transfers = useSelector(getTransfers)[month]
  const accounts = useSelector(getAccounts)
  const currency = useSelector(getUserCurrencyCode)
  const accTagMap = useSelector(getAccTagMap)
  const dispatch = useDispatch()

  const connectToTag = (account: string, tag: string | null) =>
    dispatch(addConnection(account, tag))

  const classes = useStyles()
  const formatSum = (sum: number) =>
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
    <Paper className={`${classes.root} ${className}`}>
      <Typography sx={{ p: 2 }} variant="h6" id="tableTitle">
        Переводы из бюджета
      </Typography>

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
                        <TagChip
                          id={accTagMap[row.id]}
                          onDelete={() => connectToTag(row.id, null)}
                          sx={{ ml: 1 }}
                        />
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
