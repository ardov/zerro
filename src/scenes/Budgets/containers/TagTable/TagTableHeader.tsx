import React, { FC, useContext, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { getUserCurrencyCode } from 'store/data/selectors'
import { formatDate, formatMoney } from 'helpers/format'
import {
  Typography,
  Box,
  useMediaQuery,
  IconButton,
  Menu,
  MenuItem,
  TypographyProps,
  BoxProps,
  useTheme,
} from '@material-ui/core'
import { Tooltip } from 'components/Tooltip'
import SettingsIcon from '@material-ui/icons/Settings'
import CheckCircleIcon from '@material-ui/icons/CheckCircle'
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft'
import ChevronRightIcon from '@material-ui/icons/ChevronRight'
import { fillGoals } from '../../thunks'
import { Confirm } from 'components/Confirm'
import GoalProgress from 'components/GoalProgress'
import { makeStyles } from '@material-ui/styles'
import { ToBeBudgeted } from '../ToBeBudgeted'
import useScrollPosition from '@react-hook/window-scroll'
import { useMonth } from 'scenes/Budgets/pathHooks'
import add from 'date-fns/add'
import sub from 'date-fns/sub'
import { getTotalGoalsProgress } from 'scenes/Budgets/selectors/goalsProgress'
import { DragModeContext } from '../DnDContext'
import getMonthDates from 'scenes/Budgets/selectors/getMonthDates'

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
  name: { paddingLeft: theme.spacing(1) },
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

type MonthInfoProps = { onOpenMonthDrawer: () => void }
const MonthInfo: FC<MonthInfoProps> = ({ onOpenMonthDrawer }) => {
  const c = useStyles()
  const [month, setMonth] = useMonth()
  const monthList = useSelector(getMonthDates)
  const minMonth = monthList[0]
  const maxMonth = monthList[monthList.length - 1]
  const prevMonth = month > minMonth ? +sub(month, { months: 1 }) : null
  const nextMonth = month < maxMonth ? +add(month, { months: 1 }) : null
  return (
    <Box className={c.head}>
      <Box className={c.month}>
        <IconButton
          children={<ChevronLeftIcon fontSize="inherit" />}
          onClick={() => prevMonth && setMonth(prevMonth)}
          disabled={!prevMonth}
          size="small"
          edge="start"
        />
        <IconButton
          children={<ChevronRightIcon fontSize="inherit" />}
          onClick={() => nextMonth && setMonth(nextMonth)}
          disabled={!nextMonth}
          size="small"
          edge="end"
        />
        <Typography noWrap variant="body1">
          {formatDate(month, 'LLLL')}
        </Typography>
      </Box>

      <ToBeBudgeted small onClick={onOpenMonthDrawer} />
    </Box>
  )
}

const Cell: FC<TypographyProps> = props => (
  <Typography variant="body2" color="textSecondary" noWrap {...props} />
)

type TagTableHeaderProps = BoxProps & {
  metric?: 'budgeted' | 'outcome' | 'available'
  onToggleMetric: () => void
  onOpenMonthDrawer: () => void
}

export const TagTableHeader: FC<TagTableHeaderProps> = props => {
  const {
    metric = 'available',
    onToggleMetric,
    onOpenMonthDrawer,
    ...rest
  } = props
  const c = useStyles()
  const [anchorEl, setAnchorEl] = useState<Element | null>(null)
  const { dragMode, setDragMode } = useContext(DragModeContext)

  const handleClick: React.MouseEventHandler = e => setAnchorEl(e.currentTarget)
  const handleClose = () => setAnchorEl(null)

  const toggleDragMode = () =>
    setDragMode(dragMode === 'REORDER' ? 'FUNDS' : 'REORDER')
  const handleChangeOrderClick = () => {
    toggleDragMode()
    handleClose()
  }

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('xs'))
  const scrollY = useScrollPosition(60 /*fps*/)
  const scrollOffset = isMobile ? 254 : 128
  const isVisibleHeader = scrollY > scrollOffset
  const metrics = {
    budgeted: 'Бюджет',
    outcome: 'Расход',
    available: 'Доступно',
  }

  return (
    <Box className={c.row} {...rest}>
      {isVisibleHeader && <MonthInfo onOpenMonthDrawer={onOpenMonthDrawer} />}

      {dragMode === 'REORDER' ? (
        <Cell className={c.name} onClick={toggleDragMode}>
          🖐 Хватай и тащи{' '}
          <IconButton
            children={<CheckCircleIcon fontSize="inherit" />}
            size="small"
          />
        </Cell>
      ) : (
        <Cell className={c.name} onClick={handleClick}>
          Категории{' '}
          <IconButton
            children={<SettingsIcon fontSize="inherit" />}
            size="small"
          />
        </Cell>
      )}

      {isMobile ? (
        <Cell align="right" onClick={onToggleMetric}>
          {metrics[metric]}
        </Cell>
      ) : (
        <>
          <Cell align="right" children="Бюджет" />
          <Cell align="right" children="Расход" />
          <Cell align="right" children="Доступно" />
        </>
      )}

      <GoalMonthProgress />

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem onClick={handleChangeOrderClick}>
          Изменить порядок категорий
        </MenuItem>
        <MenuItem disabled onClick={handleClose}>
          Показать все
        </MenuItem>
      </Menu>
    </Box>
  )
}

function GoalMonthProgress() {
  const dispatch = useDispatch()
  const currency = useSelector(getUserCurrencyCode)
  const [month] = useMonth()
  const totals = useSelector(getTotalGoalsProgress)?.[month]

  if (!totals)
    return (
      <Box component="span">
        <Tooltip
          arrow
          title="Установите цели, чтобы следить за их прогрессом 😉"
        >
          <IconButton size="small">
            <GoalProgress value={0} fontSize="inherit" />
          </IconButton>
        </Tooltip>
      </Box>
    )

  const { need, target, progress } = totals
  const onOk = () => dispatch(fillGoals(month))
  const formatSum = (sum: number) => formatMoney(sum, currency)

  return (
    <Box component="span">
      <Confirm
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
          title={
            need
              ? `${formatSum(target - need)} из ${formatSum(target)}`
              : `Всего нужно было ${formatSum(target)}`
          }
        >
          <IconButton size="small">
            <GoalProgress value={progress} fontSize="inherit" />
          </IconButton>
        </Tooltip>
      </Confirm>
    </Box>
  )
}
