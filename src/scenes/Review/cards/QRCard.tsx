import React from 'react'
import { Typography } from '@mui/material'
import Rhythm from 'components/Rhythm'
import pluralize from 'shared/helpers/pluralize'
import { Card } from './Card'

export function QRCard({ value = 0 }) {
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
