import React from 'react'
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
  changed,
  type,
  incomeAccountTitle,
  outcomeAccountTitle,
  deleted,
  isOpened,
  isInSelectionMode,
  isChecked,
  payee,
  tag,
  comment,
  qrCode,

  income,
  incomeCurrency,
  opIncome,
  opIncomeCurrency,
  outcome,
  outcomeCurrency,
  opOutcome,
  opOutcomeCurrency,

  onToggle,
  onClick,
  onFilterByPayee,
  onSelectChanged,
}) {
  const c = useStyles()

  const handleOpen = () => onClick(id)
  const handlePayeeClick = () => onFilterByPayee(payee)
  const handleSelectSimilar = () => onSelectChanged(changed)

  const symbol = tag ? tag[0].symbol : type === 'transfer' ? '→' : '?'
  const color = tag ? tag[0].colorRGB : null
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
          onChange={onToggle}
          color={color}
          size="m"
        />
      </ListItemAvatar>
      <ListItemText
        primary={
          <Box display="flex" justifyContent="space-between">
            <MainLine {...{ type, tag }} />
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
              minWidth={40}
            >
              {deleted && <DeletedLabel />}
              {qrCode && <QRLabel />}
              {payee && (
                <Typography
                  noWrap
                  variant="body2"
                  className={c.payee}
                  component="span"
                  onClick={handlePayeeClick}
                >
                  {payee}
                </Typography>
              )}
              {comment}
            </Typography>

            <Box minWidth={56} ml="auto" clone>
              <Typography
                variant="body2"
                component="span"
                color="textSecondary"
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

const QRLabel = () => {
  const Label = withStyles(theme => ({
    root: { marginRight: theme.spacing(1) },
  }))(Typography)
  return (
    // eslint-disable-next-line jsx-a11y/accessible-emoji
    <Label variant="body2" component="span" role="img" aria-label="чек">
      🧾
    </Label>
  )
}

const DeletedLabel = () => {
  const Label = withStyles(theme => ({
    root: { marginRight: theme.spacing(1) },
  }))(Typography)
  return (
    <Label color="error" variant="body2" component="span">
      Удалена
    </Label>
  )
}
