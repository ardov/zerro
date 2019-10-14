import React from 'react'
import styled, { css } from 'styled-components'
import { makeStyles } from '@material-ui/styles'
import { Box, Typography } from '@material-ui/core'
import { MainLine } from './MainLine'
import { Amount } from './Amount'
import Icon from './Icon'

const useStyles = makeStyles(theme => ({
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

const Body = styled.div`
  display: flex;
  flex-direction: row;
  padding: 16px;
  /* border: 1px solid rgba(0, 0, 0, 0.1); */
  /* border-bottom: 0; */
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:first-child {
    border-top-left-radius: 6px;
    border-top-right-radius: 6px;
  }

  &:last-child {
    /* border: 1px solid rgba(0, 0, 0, 0.1); */
    border-bottom-right-radius: 6px;
    border-bottom-left-radius: 6px;
  }

  &:hover {
    background-color: var(--bg-hover);
    opacity: 1;
  }

  ${props =>
    props.deleted &&
    css`
      opacity: 0.3;
    `}

  ${props =>
    props.isOpened &&
    css`
      background-color: rgba(0, 0, 0, 0.1);
      opacity: 1;

      &:hover {
        background-color: rgba(0, 0, 0, 0.1);
      }
    `}
`

export default function Transaction(props) {
  const c = useStyles()

  const handleOpen = () => props.onClick(props.id)
  const handlePayeeClick = () => props.onFilterByPayee(props.payee)
  const handleSelectSimilar = () => props.selectChanged(props.changed)

  const {
    type,
    incomeAccount,
    deleted,
    outcomeAccount,
    isOpened,
    isInSelectionMode,
    isChecked,
    payee,
    tag,
    comment,

    income,
    incomeInstrument,
    opIncome,
    opIncomeInstrument,
    outcome,
    outcomeInstrument,
    opOutcome,
    opOutcomeInstrument,

    onToggle,
  } = props

  const symbol = tag ? tag[0].symbol : type === 'transfer' ? '↔' : '?'
  const color = tag ? tag[0].color : null
  const mainAccountTitle =
    type === 'income'
      ? incomeAccount.title
      : type === 'outcome'
      ? outcomeAccount.title
      : `${outcomeAccount.title} → ${incomeAccount.title}`

  return (
    <Body
      onClick={handleOpen}
      deleted={deleted}
      isOpened={isOpened}
      onDoubleClick={handleSelectSimilar}
    >
      <Icon {...{ isChecked, isInSelectionMode, symbol, onToggle, color }} />

      {/* Main line */}
      <Box display="flex" flexDirection="column" flexGrow={1} minWidth={0}>
        <Box
          display="flex"
          flexDirection="row"
          alignItems="baseline"
          justifyContent="space-between"
          minWidth={0}
        >
          <MainLine {...{ type, tag, outcomeAccount, incomeAccount }} />
          <Amount
            {...{
              type,
              income,
              incomeInstrument,
              opIncome,
              opIncomeInstrument,
              outcome,
              outcomeInstrument,
              opOutcome,
              opOutcomeInstrument,
            }}
          />
        </Box>

        {/* Second line */}
        <Box
          display="flex"
          flexDirection="row"
          alignItems="baseline"
          justifyContent="space-between"
          minWidth={0}
        >
          <Typography
            className={c.comment}
            title={comment ? comment : ''}
            noWrap
            variant="body2"
            component="span"
            color="textSecondary"
          >
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

          <Box flexShrink="0" ml="auto">
            <Typography variant="body2" color="textSecondary">
              {mainAccountTitle}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Body>
  )
}
