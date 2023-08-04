import React, { useState } from 'react'
import { Box, IconButton, Stack, Typography } from '@mui/material'
import { formatDate } from '6-shared/helpers/date'
import { tagModel } from '5-entities/tag'
import { DisplayAmount } from '5-entities/currency/displayCurrency'
import { Card, TCardProps } from '../shared/Card'
import { useStats } from '../shared/getFacts'
import { useTrToDisplay } from '../shared/useTrToDisplay'
import { ArrowBackIcon, ArrowForwardIcon } from '6-shared/ui/Icons'

export function OutcomeCard(props: TCardProps) {
  const [i, setI] = useState(0)
  const yearStats = useStats(props.year)
  const toVal = useTrToDisplay()
  const tags = tagModel.usePopulatedTags()

  const topTransactions = yearStats.total.outcomeTransactions
    .map(tr => ({ tr, val: toVal(tr).outcome }))
    .sort((a, b) => b.val - a.val)
    .slice(0, 10)

  if (!topTransactions.length) return null

  const next = () => setI(Math.min(i + 1, topTransactions.length - 1))
  const prev = () => setI(Math.max(i - 1, 0))

  const { val, tr } = topTransactions[i]
  const { date, comment, payee, tag } = tr

  const tagTitle = tags[tag?.[0] || 'null'].title
  let additionalInfo = [formatDate(date)]
  if (tagTitle) additionalInfo.push(tagTitle)
  if (payee) additionalInfo.push(payee)
  return (
    <Card>
      <Stack spacing={1} my={1} alignItems="center">
        <Typography variant="body1" align="center">
          Покупка года #{i + 1}
        </Typography>
        <Typography variant="h4" align="center" className="red-gradient">
          <DisplayAmount value={val} noShade decMode="ifAny" />
        </Typography>
        <Typography variant="body1" align="center" color="textSecondary">
          {additionalInfo.join('  •  ')}
        </Typography>
        {comment && (
          <Box
            py={0.5}
            px={2}
            mt={1}
            alignSelf="center"
            bgcolor="background.default"
            borderRadius={1}
          >
            <Typography variant="body1" align="center" color="textSecondary">
              {comment}
            </Typography>
          </Box>
        )}

        <Stack
          spacing={1}
          direction="row"
          alignItems="center"
          sx={{ opacity: 0.3, transition: '200ms', '&:hover': { opacity: 1 } }}
        >
          <IconButton size="small" onClick={prev}>
            <ArrowBackIcon />
          </IconButton>

          <IconButton size="small" onClick={next}>
            <ArrowForwardIcon />
          </IconButton>
        </Stack>
      </Stack>
    </Card>
  )
}
