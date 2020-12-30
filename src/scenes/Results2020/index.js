import React, { useState, useCallback } from 'react'
import { Box, Typography, Paper, Chip } from '@material-ui/core'
import { useSelector } from 'react-redux'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'

import { getAccountsHistory, getYearStats } from './selectors'
import { getAccounts, getAccountList } from 'store/localData/accounts'
import { formatMoney, formatDate } from 'helpers/format'
import Rhythm from 'components/Rhythm'
import TransactionsDrawer from 'components/TransactionsDrawer'
import { Amount } from 'components/Amount'
import { getInstruments, getUserCurrencyCode } from 'store/serverData'
import { getPopulatedTags } from 'store/localData/tags'
import pluralize from 'helpers/pluralize'

export default function Stats() {
  const yearStats = useSelector(getYearStats)
  console.log('yearStats', yearStats)
  const [selected, setSelected] = useState({})
  const { total, byTag, receipts } = yearStats

  const noCategoryValue =
    byTag.null.incomeTransactions.length + byTag.null.outcomeTransactions.length

  const filterConditions = {
    accounts: [selected.id],
    dateFrom: selected.date,
    dateTo: selected.date,
  }

  return (
    <>
      <Box display="flex" flexDirection="column">
        <Rhythm gap={2} axis="y" p={3}>
          <IncomeCard byTag={byTag} />
          <OutcomeCard transaction={total.outcomeTransactions[0]} />
          <QRCard value={receipts} />
          <NoCategoryCard value={noCategoryValue} />
        </Rhythm>
      </Box>

      <TransactionsDrawer
        filterConditions={filterConditions}
        open={!!selected.date && !!selected.id}
        onClose={() => setSelected({})}
      />
    </>
  )
}

function OutcomeCard({ transaction }) {
  const { outcome, outcomeInstrument, date, comment, payee, tag } = transaction
  const currency = useSelector(getInstruments)[outcomeInstrument].shortTitle
  const tagTitle = useSelector(getPopulatedTags)[tag?.[0] || 'null'].title
  let additionalInfo = []
  if (tagTitle) additionalInfo.push(tagTitle)
  if (payee) additionalInfo.push(payee)
  return (
    <Box
      bgcolor="background.paper"
      maxWidth={480}
      borderRadius={16}
      py={3}
      px={2}
      display="flex"
      flexDirection="column"
      alignItems="center"
    >
      <Typography variant="h5" align="center">
        Самая крупная покупка
      </Typography>
      <Rhythm gap={1} my={5}>
        <Typography variant="body1" align="center" color="textSecondary">
          {formatDate(date)}
        </Typography>
        <Typography variant="h4" align="center">
          <Amount value={outcome} currency={currency} noShade decMode="ifAny" />
        </Typography>
        <Typography variant="body1" align="center" color="textSecondary">
          {additionalInfo.join('  •  ')}
        </Typography>
        <Box
          py={0.5}
          px={2}
          mt={1}
          alignSelf="center"
          bgcolor="background.default"
          borderRadius="borderRadius"
        >
          <Typography variant="body1" align="center" color="textSecondary">
            {comment}
          </Typography>
        </Box>
      </Rhythm>
    </Box>
  )
}

function NoCategoryCard({ value }) {
  return (
    <Box
      bgcolor="background.paper"
      maxWidth={480}
      borderRadius={16}
      py={3}
      px={2}
      display="flex"
      flexDirection="column"
      alignItems="center"
    >
      <Rhythm gap={1} my={5}>
        {value ? (
          <>
            <Typography variant="h4" align="center">
              {value} {pluralize(value, ['операция', 'операции', 'операций'])}
            </Typography>
            <Typography variant="body1" align="center">
              {pluralize(value, ['осталась', 'остались', 'остались'])} без
              категории
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="h4" align="center">
              👍
            </Typography>
            <Typography variant="body1" align="center">
              Круто! Ни одной операции без категории!
            </Typography>
          </>
        )}
      </Rhythm>
    </Box>
  )
}
function QRCard({ value }) {
  return (
    <Box
      bgcolor="background.paper"
      maxWidth={480}
      borderRadius={16}
      py={3}
      px={2}
      display="flex"
      flexDirection="column"
      alignItems="center"
    >
      <Rhythm gap={1} my={5}>
        {value ? (
          <>
            <Typography variant="body1" align="center">
              Вы прикрепили
            </Typography>
            <Typography variant="h4" align="center">
              {value} {pluralize(value, ['чек', 'чека', 'чеков'])}
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="h4" align="center">
              Ни одного чека
            </Typography>
            <Typography variant="body1" align="center">
              Ну и фиг с ними
            </Typography>
          </>
        )}
      </Rhythm>
    </Box>
  )
}

function IncomeCard({ byTag }) {
  const currency = useSelector(getUserCurrencyCode)
  const tags = useSelector(getPopulatedTags)
  const incomeTags = Object.keys(byTag)
    .filter(id => byTag[id].income > 0)
    .sort((a, b) => byTag[b].income - byTag[a].income)

  const [checked, setChecked] = useState(incomeTags)
  const total = checked.reduce((sum, id) => (sum += byTag[id].income), 0)

  const toggle = id => {
    if (checked.includes(id)) {
      setChecked(checked.filter(tagId => tagId !== id))
    } else {
      setChecked([...checked, id])
    }
  }
  return (
    <Box
      bgcolor="background.paper"
      maxWidth={480}
      borderRadius={16}
      py={3}
      px={2}
      display="flex"
      flexDirection="column"
      alignItems="center"
    >
      <Rhythm gap={1}>
        <Typography variant="body1" align="center">
          Вы заработали
        </Typography>
        <Typography variant="h4" align="center">
          <Amount value={total} currency={currency} noShade decMode="ifOnly" />
        </Typography>
      </Rhythm>

      <Box mt={3} textAlign="center">
        {incomeTags.map(id => (
          <Box m={0.5} display="inline-block" key={id}>
            <Chip
              // color="primary"
              variant={checked.includes(id) ? 'default' : 'outlined'}
              clickable
              onClick={() => toggle(id)}
              label={
                <>
                  {tags[id].title} (
                  <Amount
                    value={byTag[id].income}
                    currency={currency}
                    noShade
                    decMode="ifOnly"
                  />
                  )
                </>
              }
            />
          </Box>
        ))}
      </Box>
    </Box>
  )
}
