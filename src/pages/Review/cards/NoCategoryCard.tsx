import React from 'react'
import { Typography } from '@mui/material'
import Rhythm from 'shared/ui/Rhythm'
import pluralize from 'shared/helpers/pluralize'
import { Card } from './Card'

export function NoCategoryCard({ value = 0 }) {
  return (
    <Card>
      <Rhythm gap={1}>
        {value ? (
          <>
            <Typography variant="h4" align="center">
              {value} {pluralize(value, ['операция', 'операции', 'операций'])}
            </Typography>
            <Typography variant="body1" align="center">
              не {pluralize(value, ['нашла', 'нашли', 'нашли'])} свою категорию
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
