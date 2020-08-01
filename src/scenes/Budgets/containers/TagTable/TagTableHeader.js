import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { getUserCurrencyCode } from 'store/serverData'
import { formatMoney } from 'helpers/format'
import {
  Typography,
  Box,
  useMediaQuery,
  Link,
  IconButton,
} from '@material-ui/core'
import { Tooltip } from 'components/Tooltip'
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft'
import { fillGoals } from '../../thunks'
import WithConfirm from 'components/Confirm'
import ChevronRightIcon from '@material-ui/icons/ChevronRight'
import GoalProgress from 'components/GoalProgress'
import { makeStyles } from '@material-ui/styles'
import { ToBeBudgeted } from '../../containers/ToBeBudgeted'
import useScrollPosition from '@react-hook/window-scroll'
import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'
import { useMonth } from 'scenes/Budgets/useMonth'
import add from 'date-fns/add'
import sub from 'date-fns/sub'
import { getTotalGoalsProgress } from 'scenes/Budgets/selectors/goalsProgress'

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
  onToggleDragMode,
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
        onClick={onToggleDragMode}
      >
        Категории
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

      <GoalMonthProgress />
    </Box>
  )
}

function GoalMonthProgress() {
  const dispatch = useDispatch()
  const currency = useSelector(getUserCurrencyCode)
  const [month] = useMonth()
  const totals = useSelector(state => getTotalGoalsProgress(state)?.[month])

  if (!totals)
    return (
      <Box component="span">
        <Tooltip
          arrow
          interactive
          title="Установите цели, чтобы следить за их прогрессом 😉"
        >
          <IconButton size="small">
            <GoalProgress value={0} />
          </IconButton>
        </Tooltip>
      </Box>
    )

  const { need, target, progress } = totals
  const onOk = () => dispatch(fillGoals(month))
  const formatSum = sum => formatMoney(sum, currency)

  return (
    <Box component="span">
      <WithConfirm
        title="Выполнить все цели?"
        description={`${formatSum(
          need
        )} будут распределены по категориям, чтобы выполнить цели в этом месяце.`}
        onOk={onOk}
        okText="Выполнить цели"
        cancelText="Отмена"
      >
        <Tooltip
          arrow
          interactive
          title={
            need
              ? `${formatSum(target - need)} из ${formatSum(target)}`
              : `Всего нужно было ${formatSum(target)}`
          }
        >
          <IconButton size="small">
            <GoalProgress value={progress} />
          </IconButton>
        </Tooltip>
      </WithConfirm>
    </Box>
  )
}
