import React from 'react'
import { Box, Typography } from '@material-ui/core'
import { useSelector } from 'react-redux'
import { formatDate } from 'helpers/format'
import Rhythm from 'components/Rhythm'
import { Amount } from 'components/Amount'
import { getInstruments } from 'store/serverData'
import { getPopulatedTags } from 'store/localData/tags'
import { Card } from './Card'

export function OutcomeCard({ transaction }) {
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
