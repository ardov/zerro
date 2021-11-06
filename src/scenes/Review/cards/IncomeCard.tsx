import React, { useState } from 'react'
import { Box, Typography, Chip } from '@mui/material'
import { useSelector } from 'react-redux'
import Rhythm from 'components/Rhythm'
import { Amount } from 'components/Amount'
import { getUserCurrencyCode } from 'store/data/selectors'
import { getPopulatedTags } from 'store/localData/tags'
import pluralize from 'helpers/pluralize'
import { Card } from './Card'
import { Stats } from '../selectors'

interface IncomeCardProps {
  byTag: Stats['byTag']
}

export function IncomeCard({ byTag }: IncomeCardProps) {
  const currency = useSelector(getUserCurrencyCode)
  const tags = useSelector(getPopulatedTags)
  const incomeTags = Object.keys(byTag)
    .filter(id => byTag[id].income > 0)
    .sort((a, b) => byTag[b].income - byTag[a].income)

  const [checked, setChecked] = useState(incomeTags)
  const total = checked.reduce((sum, id) => (sum += byTag[id]?.income || 0), 0)

  const toggle = (id: string) => {
    if (checked.includes(id)) {
      setChecked(checked.filter(tagId => tagId !== id))
    } else {
      setChecked([...checked, id])
    }
  }

  const isRussian = currency === 'RUB'

  return (
    <Card>
      <Rhythm gap={1} alignItems="center">
        <Typography variant="body1" align="center">
          Вы заработали
        </Typography>
        <Typography variant="h4" align="center" className="green-gradient">
          <Amount value={total} currency={currency} noShade decMode="ifOnly" />
        </Typography>

        {isRussian && <NotFunFact income={total} currency={currency} />}
      </Rhythm>

      <Box mt={3} textAlign="center">
        {incomeTags.map(id => (
          <Box m={0.5} display="inline-block" key={id}>
            <Chip
              variant={checked.includes(id) ? 'filled' : 'outlined'}
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

function getPeopleArray(length: number) {
  const people = ['👩🏼', '👨🏼‍🦳', '👨🏻', '👨🏼‍🦲', '👦🏽', '👩🏻', '👵🏻', '👴🏼']
  let arr = []
  for (let i = 0; i < length; i++) {
    arr.push(people[i % (people.length - 1)])
  }
  return arr
}

function NotFunFact({
  income,
  currency,
}: {
  income: number
  currency: string
}) {
  const AVG_MONTHLY_INCOME = 35000
  const monthlyIncome = income / 12
  const rate = +(monthlyIncome / AVG_MONTHLY_INCOME).toFixed(0)
  const vat = income * (13 / 87)
  return (
    <Typography variant="body1" align="center">
      Платили 13% подоходного налога?
      <br />
      Значит ещё{' '}
      <Amount value={vat} currency={currency} noShade decMode="ifOnly" /> ушло в
      казну 🇷🇺
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
