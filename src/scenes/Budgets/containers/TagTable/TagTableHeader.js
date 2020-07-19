import React from 'react'
import {
  Typography,
  Box,
  useMediaQuery,
  Link,
  IconButton,
} from '@material-ui/core'
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft'
import ChevronRightIcon from '@material-ui/icons/ChevronRight'
import { makeStyles } from '@material-ui/styles'
import { ToBeBudgeted } from '../../containers/ToBeBudgeted'
import useScrollPosition from '@react-hook/window-scroll'
import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'
import { useMonth } from 'scenes/Budgets/useMonth'
import add from 'date-fns/add'
import sub from 'date-fns/sub'

const useStyles = makeStyles(theme => ({
  row: {
    padding: theme.spacing(2),
    position: 'sticky',
    top: 0,
    zIndex: 2,
    width: '100%',
    alignItems: 'center',
    display: 'grid',
    background: theme.palette.background.paper,
    borderBottom: `1px solid ${theme.palette.divider}`,
    gridTemplateColumns: 'auto 90px 90px 90px 16px',
    gridColumnGap: theme.spacing(2),
    gridRowGap: theme.spacing(1),

    [theme.breakpoints.down('xs')]: {
      gridTemplateColumns: 'auto 90px 16px',
      gridColumnGap: theme.spacing(0.5),
    },
  },
  name: { paddingLeft: theme.spacing(2) },
  head: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    gridColumnStart: 1,
    gridColumnEnd: 6,
    [theme.breakpoints.down('xs')]: {
      gridColumnEnd: 4,
    },
  },
  month: {
    display: 'grid',
    gridAutoFlow: 'column',
    placeItems: 'center',
    gridGap: theme.spacing(1),
    height: 40,
    padding: theme.spacing(0, 1),
    borderRadius: theme.shape.borderRadius,
    textTransform: 'capitalize',
    background: theme.palette.background.default,
    '&:hover': {
      background: theme.palette.action.hover,
    },
  },
}))

export default function TagTableHeader({
  metric = 'available',
  onToggleMetric,
  onOpenMonthDrawer,
  title = 'Категория',
  ...rest
}) {
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('xs'))
  const c = useStyles()
  const [month, setMonth] = useMonth()
  const scrollY = useScrollPosition(60 /*fps*/)
  const scrollOffset = isMobile ? 254 : 128
  const isVisibleHeader = scrollY > scrollOffset
  const metrics = {
    budgeted: 'Бюджет',
    outcome: 'Расход',
    available: 'Доступно',
  }

  const prevMonth = +sub(month, { months: 1 })
  const nextMonth = +add(month, { months: 1 })

  return (
    <Box className={c.row} {...rest}>
      {isVisibleHeader && (
        <Box className={c.head}>
          <Box className={c.month}>
            <IconButton
              children={<ChevronLeftIcon />}
              onClick={() => setMonth(prevMonth)}
              size="small"
              edge="start"
            />

            <Typography noWrap variant="body1">
              {format(month, 'LLLL', { locale: ru })}
            </Typography>

            <IconButton
              children={<ChevronRightIcon />}
              onClick={() => setMonth(nextMonth)}
              size="small"
              edge="end"
            />
          </Box>

          <ToBeBudgeted small onClick={onOpenMonthDrawer} />
        </Box>
      )}

      <Typography
        className={c.name}
        variant="body2"
        color="textSecondary"
        noWrap
      >
        {title}
      </Typography>

      {isMobile ? (
        <Typography variant="body2" color="textSecondary" align="right" noWrap>
          <Link color="textSecondary" onClick={onToggleMetric}>
            {metrics[metric]}
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
            children="Расход"
          />
          <Typography
            variant="body2"
            color="textSecondary"
            align="right"
            noWrap
            children="Доступно"
          />
        </>
      )}
    </Box>
  )
}
