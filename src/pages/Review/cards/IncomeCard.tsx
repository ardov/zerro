import React, { useState } from 'react'
import { Box, Typography, Chip } from '@mui/material'
import Rhythm from '@shared/ui/Rhythm'

import { useAppSelector } from '@store'
import { getPopulatedTags } from '@entities/tag'
import { Card, TCardProps } from '../shared/Card'
import { useStats } from '../shared/getFacts'
import {
  DisplayAmount,
  displayCurrency,
} from '@entities/currency/displayCurrency'
import { entries } from '@shared/helpers/keys'
import { addFxAmount } from '@shared/helpers/money'
import { NotFunFact } from './NotFunFact'

export function IncomeCard(props: TCardProps) {
  const yearStats = useStats(props.year)
  const toDisplay = displayCurrency.useToDisplay('current')
  const tags = useAppSelector(getPopulatedTags)

  const incomeTags = entries(yearStats.byTag)
    .map(([id, info]) => {
      return {
        id: id,
        tag: tags[id],
        name: tags[id].uniqueName,
        incomeFx: info.income,
        income: toDisplay(info.income),
        transactions: info.incomeTransactions,
      }
    })
    .filter(tagInfo => tagInfo.income > 0)
    .sort((a, b) => b.income - a.income)

  const [checked, setChecked] = useState(incomeTags.map(t => t.id))

  const totalIncomeFx = incomeTags
    .filter(t => checked.includes(t.id))
    .reduce((sum, t) => addFxAmount(sum, t.incomeFx), {})

  const toggle = (id: string) => {
    if (checked.includes(id)) {
      setChecked(checked.filter(tagId => tagId !== id))
    } else {
      setChecked([...checked, id])
    }
  }

  return (
    <Card>
      <Rhythm gap={1} alignItems="center">
        <Typography variant="body1" align="center">
          Вы заработали
        </Typography>
        <Typography variant="h4" align="center" className="green-gradient">
          <DisplayAmount value={totalIncomeFx} noShade decMode="ifOnly" />
        </Typography>
        <NotFunFact income={totalIncomeFx} />
      </Rhythm>

      <Box mt={3} textAlign="center">
        {incomeTags.map(tagInfo => (
          <Box m={0.5} display="inline-block" key={tagInfo.id}>
            <Chip
              variant={checked.includes(tagInfo.id) ? 'filled' : 'outlined'}
              clickable
              onClick={() => toggle(tagInfo.id)}
              label={
                <>
                  {tagInfo.name} (
                  <DisplayAmount
                    value={tagInfo.incomeFx}
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
