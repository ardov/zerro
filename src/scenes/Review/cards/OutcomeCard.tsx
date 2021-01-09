import React from 'react'
import { Box, Typography } from '@material-ui/core'
import { useSelector } from 'react-redux'
import { formatDate } from 'helpers/format'
import Rhythm from 'components/Rhythm'
import { Amount } from 'components/Amount'
import { getInstruments } from 'store/serverData'
import { getPopulatedTags } from 'store/localData/tags'
import { Card } from './Card'
import { Transaction } from 'types'

export function OutcomeCard({ transaction }: { transaction: Transaction }) {
  const { outcome, outcomeInstrument, date, comment, payee, tag } = transaction
  const currency = useSelector(getInstruments)[outcomeInstrument].shortTitle
  const tagTitle = useSelector(getPopulatedTags)[tag?.[0] || 'null'].title
  let additionalInfo = [formatDate(date)]
  if (tagTitle) additionalInfo.push(tagTitle)
  if (payee) additionalInfo.push(payee)
  return (
    <Card>
      <Typography variant="body1" align="center">
        Покупка года
      </Typography>
      <Rhythm gap={1} my={1} alignItems="center">
        <Typography variant="h4" align="center" className="red-gradient">
          <Amount value={outcome} currency={currency} noShade decMode="ifAny" />
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
            borderRadius="borderRadius"
          >
            <Typography variant="body1" align="center" color="textSecondary">
              {comment}
            </Typography>
          </Box>
        )}
      </Rhythm>
    </Card>
  )
}
