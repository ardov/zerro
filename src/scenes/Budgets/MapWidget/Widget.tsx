import React, { useState } from 'react'
import { Box, Button, Paper, PaperProps, Typography } from '@mui/material'
import { TagMapChart } from './TagMapChart'
import { sendEvent } from 'shared/helpers/tracking'
import { getTotalsByMonth } from '../selectors'
import { useMonth } from '../pathHooks'
import { useAppSelector } from 'store'

type WidgetProps = PaperProps & {
  onSelectTag: (id: string) => void
}

export const Widget = (props: WidgetProps) => {
  const { onSelectTag, ...paperProps } = props
  const [visible, setVisible] = useState(false)
  return (
    <Paper {...paperProps}>
      <Box p={2} minWidth="100%">
        <Typography variant="h6">Конверты</Typography>
        <Typography variant="body1" color="text.secondary">
          Категории — это ваши «виртуальные конверты». Все деньги в балансе
          делятся между ними и выглядит это как-то так:
        </Typography>
        {visible && <OverspentNotice />}
      </Box>
      <Box p={2} pt={0}>
        {visible ? (
          <TagMapChart
            onSelect={id => {
              sendEvent('Budget map chart: show tag details')
              onSelectTag(id)
            }}
          />
        ) : (
          <Button
            variant="outlined"
            onClick={() => {
              sendEvent('Budget map chart: show')
              setVisible(true)
            }}
          >
            Показывай
          </Button>
        )}
      </Box>
    </Paper>
  )
}

function OverspentNotice() {
  const [month] = useMonth()
  const totals = useAppSelector(getTotalsByMonth)?.[month]
  const overspent = totals?.overspent
  const toBeBudgeted = totals?.toBeBudgeted
  if (!overspent && toBeBudgeted >= 0) return null
  return (
    <Typography variant="body1" color="text.secondary">
      ⚠️ <i>В бюджете есть перерасходы, поэтому картина может быть неточной.</i>
    </Typography>
  )
}
