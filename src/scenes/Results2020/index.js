import React, { useState } from 'react'
import { Box, Typography, Chip } from '@material-ui/core'
import { useSelector } from 'react-redux'
import './index.scss'
import { getAccountsHistory, getYearStats } from './selectors'
import { getAccounts, getAccountList } from 'store/localData/accounts'
import { formatDate } from 'helpers/format'
import Rhythm from 'components/Rhythm'
import TransactionsDrawer from 'components/TransactionsDrawer'
import { Amount } from 'components/Amount'
import { getInstruments, getUserCurrencyCode } from 'store/serverData'
import { getPopulatedTags } from 'store/localData/tags'
import pluralize from 'helpers/pluralize'
import { Card } from './Card'

export default function Stats() {
  const yearStats = useSelector(getYearStats)
  console.log('yearStats', yearStats)
  const [selected, setSelected] = useState({})

  if (!yearStats) return null
  const { total, byTag, receipts, byPayee } = yearStats

  const noCategoryValue =
    byTag.null.incomeTransactions.length + byTag.null.outcomeTransactions.length

  const filterConditions = {
    accounts: [selected.id],
    dateFrom: selected.date,
    dateTo: selected.date,
  }

  return (
    <>
      <Box className="container">
        <Rhythm gap={2} axis="y" p={3}>
          <IncomeCard byTag={byTag} />
          <PayeeByOutcomeCard byPayee={byPayee} />
          <PayeeByFrequencyCard byPayee={byPayee} />
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
    <Card>
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
    </Card>
  )
}

function NoCategoryCard({ value }) {
  return (
    <Card>
      <Rhythm gap={1}>
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
    </Card>
  )
}

function QRCard({ value }) {
  return (
    <Card>
      <Rhythm gap={1}>
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
    </Card>
  )
}

function PayeeByOutcomeCard({ byPayee }) {
  const currency = useSelector(getUserCurrencyCode)
  const sortedPayees = Object.keys(byPayee).sort(
    (a, b) => byPayee[b].outcome - byPayee[a].outcome
  )
  const topPayee = sortedPayees[0]
  const transactions = byPayee[topPayee].outcomeTransactions.length
  const outcome = byPayee[topPayee].outcome

  return (
    <Card>
      <Rhythm gap={1}>
        <Typography variant="h4" align="center">
          {topPayee}
        </Typography>
        <Typography variant="body1" align="center">
          Здесь вы оставили{' '}
          <Amount
            value={outcome}
            currency={currency}
            noShade
            decMode="ifOnly"
          />{' '}
          ({transactions}
          {' '}
          {pluralize(transactions, ['покупка', 'покупки', 'покупок'])})
        </Typography>
      </Rhythm>
    </Card>
  )
}

function PayeeByFrequencyCard({ byPayee }) {
  const currency = useSelector(getUserCurrencyCode)
  const sortedPayees = Object.keys(byPayee).sort(
    (a, b) =>
      byPayee[b].outcomeTransactions.length -
      byPayee[a].outcomeTransactions.length
  )
  const topPayee = sortedPayees[0]
  const transactions = byPayee[topPayee].outcomeTransactions.length
  const outcome = byPayee[topPayee].outcome

  return (
    <Card>
      <Rhythm gap={1}>
        <Typography variant="body1" align="center">
          Любимое место
        </Typography>
        <Typography variant="h4" align="center">
          {topPayee}
        </Typography>
        <Typography variant="body1" align="center">
          {transactions}
          {' '}
          {pluralize(transactions, ['покупка', 'покупки', 'покупок'])} со
          средним чеком{' '}
          <Amount
            value={outcome / transactions}
            currency={currency}
            noShade
            decMode="ifOnly"
          />
          .
          <br />А всего потратили{' '}
          <Amount value={outcome} currency={currency} noShade decMode="ifAny" />
        </Typography>
      </Rhythm>
    </Card>
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

  const isRussian = currency === 'RUB'

  return (
    <Card>
      <Rhythm gap={1}>
        <Typography variant="body1" align="center">
          Вы заработали
        </Typography>
        <Typography variant="h4" align="center" className="income-amount">
          <Amount value={total} currency={currency} noShade decMode="ifOnly" />
        </Typography>

        {isRussian && <NotFunFact income={total} currency={currency} />}
      </Rhythm>

      <Box mt={3} textAlign="center">
        {incomeTags.map(id => (
          <Box m={0.5} display="inline-block" key={id}>
            <Chip
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
    </Card>
  )
}

function getPeopleArray(length) {
  const people = ['👩🏼', '👨🏼‍🦳', '👨🏻', '👨🏼‍🦲', '👦🏽', '👩🏻', '👵🏻', '👴🏼']
  let arr = []
  for (let i = 0; i < length; i++) {
    arr.push(people[i % (people.length - 1)])
  }
  return arr
}

function NotFunFact({ income, currency }) {
  const AVG_MONTHLY_INCOME = 35000
  const monthlyIncome = income / 12
  const rate = (monthlyIncome / AVG_MONTHLY_INCOME).toFixed(0)

  return (
    <Typography variant="body1" align="center">
      Платили 13% подоходного налога?
      <br />
      Значит ещё{' '}
      <Amount
        value={income * 0.13}
        currency={currency}
        noShade
        decMode="ifOnly"
      />{' '}
      ушло в казну 🇷🇺
      {rate > 1 && (
        <>
          <br />
          <br />
          {getPeopleArray(rate).join(' ')}
          <br />
          {`Это ${rate} ${pluralize(rate, [
            'средний россиянин',
            'средних россиянина',
            'средних россиян',
          ])}.`}
          <br />
          Если сложить их зарплаты — получится ваша.
        </>
      )}
    </Typography>
  )
}
