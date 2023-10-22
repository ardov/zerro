import React from 'react'
import { ButtonBase, Stack, Typography } from '@mui/material'
import pluralize from '6-shared/helpers/pluralize'
import { Card, TCardProps } from '../shared/Card'
import { useStats } from '../shared/getFacts'

// TODO: i18n
export function NoCategoryCard(props: TCardProps) {
  const yearStats = useStats(props.year)
  const noTag = [
    ...yearStats.total.incomeTransactions.filter(tr => !tr.tag),
    ...yearStats.total.outcomeTransactions.filter(tr => !tr.tag),
  ]
  const value = noTag.length
  return (
    <Card>
      <Stack spacing={1}>
        {value ? (
          <>
            <ButtonBase
              sx={{ borderRadius: 1, px: 1 }}
              onClick={() => props.onShowTransactions(noTag)}
            >
              <Typography variant="h4" align="center">
                {value} {pluralize(value, ['операция', 'операции', 'операций'])}
              </Typography>
            </ButtonBase>
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
      </Stack>
    </Card>
  )
}
