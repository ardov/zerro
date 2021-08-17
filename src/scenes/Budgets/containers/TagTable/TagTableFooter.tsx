import React, { FC } from 'react'
import { useSelector } from 'react-redux'
import {
  Typography,
  Box,
  useMediaQuery,
  TypographyProps,
  Theme,
} from '@material-ui/core'
import { Amount } from 'components/Amount'
import { makeStyles } from '@material-ui/styles'
import { useMonth } from 'scenes/Budgets/pathHooks'
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

    [theme.breakpoints.down('sm')]: {
      gridTemplateColumns: 'auto 90px 16px',
      gridColumnGap: theme.spacing(0.5),
    },
  },
  name: { paddingLeft: theme.spacing(1) },
}))

const Cell: FC<TypographyProps> = props => (
  <Typography variant="body2" color="textSecondary" noWrap {...props} />
)

export const TagTableFooter: FC<{
  metric: 'available' | 'budgeted' | 'outcome'
}> = props => {
  const { metric = 'available' } = props
  const [month] = useMonth()
  const totalsByMonth = useSelector(getTotalsByMonth)
  const { budgeted, outcome, available } = totalsByMonth[month]
  const c = useStyles()
  const isMobile = useMediaQuery<Theme>(theme => theme.breakpoints.down('sm'))
  const metrics = { budgeted, outcome, available }

  return (
    <Box className={c.row}>
      <Cell className={c.name}>Итого</Cell>

      {isMobile ? (
        <Cell align="right">
          <Amount value={metrics[metric]} decMode="ifOnly" />
        </Cell>
      ) : (
        <>
          <Cell align="right" title={budgeted.toString()}>
            <Amount value={budgeted} decMode="ifOnly" />
          </Cell>
          <Cell align="right" title={outcome.toString()}>
            <Amount value={-outcome} decMode="ifOnly" />
          </Cell>
          <Cell align="right" title={available.toString()}>
            <Amount value={available} decMode="ifOnly" />
          </Cell>
        </>
      )}
    </Box>
  )
}
