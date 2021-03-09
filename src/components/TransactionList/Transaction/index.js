import React from 'react'
import { useSelector } from 'react-redux'
import { getInstrument, getMerchants } from 'store/data/selectors'
import { getAccount } from 'store/localData/accounts'
import { getPopulatedTag } from 'store/localData/tags'
import { getTransaction } from 'store/localData/transactions'
import { getType } from 'store/localData/transactions/helpers'

import { makeStyles } from '@material-ui/styles'
import { withStyles } from '@material-ui/core/styles'
import {
  Box,
  Typography,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@material-ui/core'
import EmojiIcon from 'components/EmojiIcon'
import { MainLine } from './MainLine'
import { Amount } from './Amount'

const useStyles = makeStyles(theme => ({
  listItem: { borderRadius: theme.shape.borderRadius },
  payee: {
    minWidth: 0,
    marginRight: theme.spacing(1),
    borderBottom: `1px solid ${theme.palette.divider}`,
    transition: '0.2s',

    '&:hover': {
      color: theme.palette.text.primary,
      borderBottom: `1px solid ${theme.palette.text.secondary}`,
    },
  },
  comment: {
    marginRight: theme.spacing(2),
    minWidth: 0,
  },
}))

export default function Transaction({
  id,

  isOpened,
  isInSelectionMode,
  isChecked,

  onToggle,
  onClick,
  onFilterByPayee,
  onSelectChanged,
}) {
  const c = useStyles()

  const merchants = useSelector(getMerchants)
  const tr = useSelector(state => getTransaction(state, id))
  const type = getType(tr)
  const {
    deleted,
    payee,
    merchant,
    comment,
    income,
    opIncome,
    outcome,
    opOutcome,
    changed,
    qrCode,
  } = tr

  const incomeCurrency = useSelector(
    state => getInstrument(state, tr.incomeInstrument)?.shortTitle
  )
  const incomeAccountTitle = useSelector(
    state => getAccount(state, tr.incomeAccount)?.title
  )
  const opIncomeCurrency = useSelector(
    state => getInstrument(state, tr.opIncomeInstrument)?.shortTitle
  )
  const outcomeCurrency = useSelector(
    state => getInstrument(state, tr.outcomeInstrument)?.shortTitle
  )
  const outcomeAccountTitle = useSelector(
    state => getAccount(state, tr.outcomeAccount)?.title
  )
  const opOutcomeCurrency = useSelector(
    state => getInstrument(state, tr.opOutcomeInstrument)?.shortTitle
  )

  const merchantName =
    merchant && merchants[merchant] ? merchants[merchant].title : payee

  // TODO: вызывает постоянные ререндеры, т.к. каждый раз новый объект.
  //       можно попробовать подключать теги уже на месте в <MainLine/>
  const tag = useSelector(state => {
    if (tr?.tag?.length) return tr.tag.map(id => getPopulatedTag(state, id))
    else return null
  })

  const handleOpen = () => onClick && onClick(id)
  const handlePayeeClick = e => {
    e.preventDefault()
    e.stopPropagation()
    onFilterByPayee(payee)
  }
  const handleSelectSimilar = () => onSelectChanged(changed)

  const symbol = tag ? tag[0].symbol : type === 'transfer' ? '→' : '?'
  const color = tag?.[0].colorRGB || null
  const mainAccountTitle =
    type === 'income'
      ? incomeAccountTitle
      : type === 'outcome'
      ? outcomeAccountTitle
      : `${outcomeAccountTitle} → ${incomeAccountTitle}`

  return (
    <ListItem
      className={c.listItem}
      button
      onClick={handleOpen}
      selected={isOpened}
      onDoubleClick={handleSelectSimilar}
    >
      <ListItemAvatar>
        <EmojiIcon
          symbol={symbol}
          showCheckBox={isInSelectionMode}
          checked={isChecked}
          onChange={() => onToggle(id)}
          color={color}
          size="m"
        />
      </ListItemAvatar>
      <ListItemText
        primary={
          <Box display="flex" justifyContent="space-between">
            <MainLine type={type} tag={tr.tag} />
            <Amount
              {...{
                type,
                income,
                incomeCurrency,
                opIncomeCurrency,
                outcomeCurrency,
                opOutcomeCurrency,
                opIncome,
                outcome,
                opOutcome,
              }}
            />
          </Box>
        }
        secondary={
          <Box display="flex" justifyContent="space-between" component="span">
            <Typography
              className={c.comment}
              title={comment ? comment : ''}
              noWrap
              variant="body2"
              component="span"
              color="textSecondary"
            >
              {deleted && <DeletedLabel />}
              {qrCode && <QRLabel />}
              {!!merchantName && (
                <Typography
                  noWrap
                  variant="body2"
                  className={c.payee}
                  component="span"
                  onClick={handlePayeeClick}
                >
                  {merchantName}
                </Typography>
              )}
              {comment}
            </Typography>

            <Box minWidth={56} ml="auto" clone>
              <Typography
                variant="body2"
                component="span"
                color="textSecondary"
                align="right"
                noWrap
              >
                {mainAccountTitle}
              </Typography>
            </Box>
          </Box>
        }
      />
    </ListItem>
  )
}

const Label = withStyles(theme => ({
  root: { marginRight: theme.spacing(1) },
}))(Typography)

const QRLabel = () => (
  // eslint-disable-next-line jsx-a11y/accessible-emoji
  <Label variant="body2" component="span" role="img" aria-label="чек">
    🧾
  </Label>
)

const DeletedLabel = () => (
  <Label color="error" variant="body2" component="span">
    Удалена
  </Label>
)
