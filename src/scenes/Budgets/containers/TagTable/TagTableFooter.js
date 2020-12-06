import React from 'react'
import { useSelector } from 'react-redux'
import { Typography, Box, useMediaQuery } from '@material-ui/core'
import { Amount } from '../components'
import { makeStyles } from '@material-ui/styles'
import { useMonth } from 'scenes/Budgets/useMonth'
import { getTotalsByMonth } from '../../selectors/getTotalsByMonth'

const useStyles = makeStyles(theme => ({
  row: {
    padding: theme.spacing(2),
    width: '100%',
    alignItems: 'center',
    display: 'grid',
    background: theme.palette.background.paper,
    gridTemplateColumns: 'auto 90px 90px 90px 16px',
    gridColumnGap: theme.spacing(2),
    gridRowGap: theme.spacing(1),

    [theme.breakpoints.down('xs')]: {
      gridTemplateColumns: 'auto 90px 16px',
      gridColumnGap: theme.spacing(0.5),
    },
  },
  name: { paddingLeft: theme.spacing(1) },
}))

const Cell = props => (
  <Typography variant="body2" color="textSecondary" noWrap {...props} />
)

export function TagTableFooter({ metric = 'available' }) {
  const [month] = useMonth()
  const totalsByMonth = useSelector(getTotalsByMonth)
  const { budgeted, outcome, available } = totalsByMonth[month]
  const c = useStyles()
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('xs'))
  const metrics = { budgeted, outcome, available }

  return (
    <Box className={c.row}>
      <Cell className={c.name}>Итого</Cell>

      {isMobile ? (
        <Cell align="right">{metrics[metric]}</Cell>
      ) : (
        <>
          <Cell align="right" title={budgeted}>
            <Amount value={budgeted} decMode="ifOnly" />
          </Cell>
          <Cell align="right" title={outcome}>
            <Amount value={-outcome} decMode="ifOnly" />
          </Cell>
          <Cell align="right" title={available}>
            <Amount value={available} decMode="ifOnly" />
          </Cell>
        </>
      )}
    </Box>
  )
}
