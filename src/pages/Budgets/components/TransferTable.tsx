import React, { FC } from 'react'
import { formatMoney } from 'shared/helpers/format'
import { getUserCurrencyCode } from 'models/data/instruments'
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
import { addConnection, getAccTagMap } from 'models/data/hiddenData/accTagMap'
import { getTransfers } from '../selectors'
import { getAccounts } from 'models/data/accounts'
import TagChip from 'components/TagChip'
import { useMonth } from '../pathHooks'
import { useAppDispatch, useAppSelector } from 'models'

const useStyles = makeStyles(theme => ({
  root: {
    width: '100%',
    overflowX: 'auto',
  },
  head: { position: 'sticky', top: 0 },
}))

export const TransferTable: FC<PaperProps> = ({ className, ...rest }) => {
  const [month] = useMonth()
  const transfers = useAppSelector(getTransfers)[month]
  const accounts = useAppSelector(getAccounts)
  const currency = useAppSelector(getUserCurrencyCode)
  const accTagMap = useAppSelector(getAccTagMap)
  const dispatch = useAppDispatch()

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
