import React from 'react'
import { Typography, Box, useMediaQuery, Link } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'

const useStyles = makeStyles(theme => ({
  row: {
    display: 'grid',
    width: '100%',
    gridTemplateColumns: ({ isMobile }) =>
      isMobile ? 'auto 120px' : 'auto 120px 120px 120px',
    alignItems: 'center',
    gridColumnGap: theme.spacing(4),
  },
}))

export default function TagTableHeader({
  metric = 'available',
  onToggleMetric,
  ...rest
}) {
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('xs'))
  const c = useStyles({ isMobile })
  const metrics = {
    budgeted: 'Бюджет',
    outcome: 'Потрачено',
    available: 'Остаток',
  }

  return (
    <Box p={2} pl={9.5} width="100%" className={c.row} {...rest}>
      <Typography variant="body2" color="textSecondary" noWrap>
        Категория
      </Typography>

      {isMobile ? (
        <Typography variant="body2" color="textSecondary" align="right" noWrap>
          <Link color="textSecondary" onClick={onToggleMetric}>
            {metrics[metric]}
            {metric === 'available' && (
              <Box component="span" minWidth={24} display="inline-block" />
            )}
          </Link>
        </Typography>
      ) : (
        <>
          <Typography
            variant="body2"
            color="textSecondary"
            align="right"
            noWrap
            children="Бюджет"
          />
          <Typography
            variant="body2"
            color="textSecondary"
            align="right"
            noWrap
            children="Потрачено"
          />

          <Typography
            variant="body2"
            color="textSecondary"
            align="right"
            noWrap
          >
            Остаток
            <Box component="span" minWidth={24} display="inline-block" />
          </Typography>
        </>
      )}
    </Box>
  )
}
