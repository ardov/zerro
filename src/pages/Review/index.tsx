import React, { useState } from 'react'
import { Box, Button, Typography } from '@mui/material'
import './index.scss'
import Rhythm from '@shared/ui/Rhythm'
import { OutcomeCard } from './cards/OutcomeCard'
import { NoCategoryCard } from './cards/NoCategoryCard'
import { QRCard } from './cards/QRCard'
import { PayeeByOutcomeCard } from './cards/PayeeByOutcomeCard'
import { PayeeByFrequencyCard } from './cards/PayeeByFrequencyCard'
import { IncomeCard } from './cards/IncomeCard'
import { Card } from './shared/Card'

export default function Review() {
  const [year, setYear] = useState(new Date().getFullYear())

  return (
    <Box className="container">
      <Rhythm gap={2} axis="y" p={3} pb={10}>
        <CardTitle year={year} />
        <IncomeCard year={year} />
        <PayeeByOutcomeCard year={year} />
        <PayeeByFrequencyCard year={year} />
        <OutcomeCard year={year} />
        <QRCard year={year} />
        <NoCategoryCard year={year} />
        <Button onClick={() => setYear(year - 1)}>
          А что было в прошлом году?
        </Button>
      </Rhythm>
    </Box>
  )
}

function CardTitle({ year }: { year: number }) {
  return (
    <Card>
      <Typography
        variant="body1"
        align="center"
        color="textSecondary"
        className="results"
      >
        ИТОГИ ГОДА
      </Typography>
      <Box position="relative">
        <Typography variant="h1" align="center" className="year">
          <b>{year}</b>
        </Typography>
        <Typography variant="h1" align="center" className="year shadow">
          <b>{year}</b>
        </Typography>
      </Box>
    </Card>
  )
}
