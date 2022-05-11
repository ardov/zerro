import React, { FC, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { EmojiIcon } from 'components/EmojiIcon'
import {
  Box,
  Typography,
  IconButton,
  Grid,
  ButtonBase,
  InputBase,
  InputAdornment,
  Button,
} from '@mui/material'
import { Tooltip } from 'components/Tooltip'
import {
  CloseIcon,
  EditIcon,
  EmojiFlagsIcon,
  NotesIcon,
} from 'components/Icons'
import { getPopulatedTag } from 'store/data/tags'
import { Total, Line as TextLine } from '../components'
import {
  getAmountsById,
  // getGoalsProgress
} from 'scenes/Budgets/selectors'
import Rhythm from 'components/Rhythm'
import { useMonth } from 'scenes/Budgets/pathHooks'
import { LinkedAccs } from './LinkedAccs'
import { OutcomeWidget } from './OutcomeWidget'
import { ColorPicker } from 'components/ColorPickerPopover'
import { hex2int } from 'helpers/color'
import { patchTag } from 'store/data/tags/thunks'
import { sendEvent } from 'helpers/tracking'
import { PopulatedTag } from 'types'
import { TagEditDialog } from 'components/TagEditDialog'
import { useToggle } from 'helpers/useToggle'
import { getTagComment, setTagComment } from 'store/data/hiddenData/tagMeta'
import { BudgetPopover } from '../BudgetPopover'
import { getGoals } from 'store/data/hiddenData/goals'
import { goalToWords } from 'store/data/hiddenData/goals/helpers'
import { useDebounce } from 'helpers/useDebounce'
import { GoalPopover } from '../GoalPopover'
import { useSearchParam } from 'helpers/useSearchParam'

type TagPreviewProps = {
  id: string
  onClose: () => void
}

const cardStyle = {
  borderRadius: 1,
  py: 1,
  px: 2,
  bgcolor: 'background.default',
  width: '100%',
}

export const TagPreview: FC<TagPreviewProps> = ({ onClose, id }) => {
  const [month] = useMonth()
  const [, setId] = useSearchParam('transactions')
  const tag = useSelector(state => getPopulatedTag(state, id))
  const goal = useSelector(getGoals)[id]
  // const goalProgress = useSelector(getGoalsProgress)?.[month]?.[id]
  const amounts = useSelector(getAmountsById)?.[month]?.[id]
  const [budgetPopoverAnchor, setBudgetPopoverAnchor] = useState<Element>()
  const [goalPopoverAnchor, setGoalPopoverAnchor] = useState<Element>()
  if (!amounts) return null

  const {
    // available,
    totalAvailable,
    // leftover,
    totalLeftover,
    // budgeted,
    totalBudgeted,
    // children,
    // childrenAvailable,
    // childrenBudgeted,
    // childrenIncome,
    // childrenLeftover,
    // childrenOutcome,
    // childrenOverspent,
    // income,
    // outcome,
    // tagOutcome,
    // totalIncome,
    totalOutcome,
    // totalOverspent,
    transferOutcome,
  } = amounts

  return (
    <>
      <Box position="relative">
        <Header tag={tag} onClose={onClose} />

        <Grid container spacing={2} px={3} pt={3}>
          <Grid item xs={12}>
            <CommentWidget key={id} id={id} />
          </Grid>

          <Grid item xs={12}>
            <ButtonBase
              onClick={e => setGoalPopoverAnchor(e.currentTarget)}
              sx={{
                ...cardStyle,
                display: 'flex',
                justifyContent: 'flex-start',
                gap: 1,
              }}
            >
              <EmojiFlagsIcon />
              <Typography
                variant="body1"
                textAlign="left"
                component="span"
                color={goal ? 'text.primary' : 'text.hint'}
              >
                {goal ? goalToWords(goal) : 'Цель'}
              </Typography>
            </ButtonBase>
          </Grid>

          <Grid item xs={6}>
            <ButtonBase
              onClick={e => setBudgetPopoverAnchor(e.currentTarget)}
              sx={cardStyle}
            >
              <Total name="Бюджет" value={totalBudgeted} decMode="ifAny" />
            </ButtonBase>
          </Grid>

          <Grid item xs={6}>
            <Box sx={cardStyle}>
              <Total name="Доступно" value={totalAvailable} decMode="ifAny" />
            </Box>
          </Grid>

          <Grid item xs={12}>
            <OutcomeWidget tagId={id} />
          </Grid>
        </Grid>

        <Rhythm gap={1.5} px={3} mt={3}>
          <TextLine name="Остаток с прошлого месяца" amount={totalLeftover} />
          <TextLine name="Бюджет" amount={totalBudgeted} />
          <TextLine name="Расход" amount={totalOutcome} />
          {!!transferOutcome && (
            <TextLine name="Переводы" amount={transferOutcome} />
          )}
          <Box>
            <Button onClick={() => setId(id)} fullWidth>
              Показать операции
            </Button>
          </Box>
          <Box my={5}>
            <LinkedAccs id={id} />
          </Box>
        </Rhythm>
      </Box>

      <BudgetPopover
        id={id}
        month={month}
        open={!!budgetPopoverAnchor}
        anchorEl={budgetPopoverAnchor}
        onClose={() => setBudgetPopoverAnchor(undefined)}
      />
      <GoalPopover
        id={id}
        open={!!goalPopoverAnchor}
        anchorEl={goalPopoverAnchor}
        onClose={() => setGoalPopoverAnchor(undefined)}
      />
    </>
  )
}

const Header: FC<{
  tag: PopulatedTag
  onClose: () => void
}> = ({ tag, onClose }) => {
  const [anchorEl, setAnchorEl] = useState<Element | null>(null)
  const [showEditor, toggleEditor] = useToggle()
  const dispatch = useDispatch()
  const handleColorChange = (hex?: string | null) => {
    sendEvent('Tag: set color: ' + hex)
    dispatch(patchTag({ id: tag.id, color: hex2int(hex) }))
  }
  return (
    <Box
      py={1}
      px={3}
      display="flex"
      alignItems="center"
      position="sticky"
      bgcolor="background.paper"
      zIndex={5}
      top={0}
    >
      <Box flexGrow={1} display="flex" minWidth={0} alignItems="center">
        <EmojiIcon
          size="m"
          symbol={tag.symbol}
          mr={2}
          flexShrink={0}
          color={tag.colorHEX}
          onClick={e => setAnchorEl(e.currentTarget)}
          button
        />
        <Typography variant="h6" component="span" noWrap>
          {tag.name}
        </Typography>
      </Box>

      <Tooltip title="Изменить">
        <IconButton onClick={toggleEditor} children={<EditIcon />} />
      </Tooltip>
      <Tooltip title="Закрыть">
        <IconButton edge="end" onClick={onClose} children={<CloseIcon />} />
      </Tooltip>

      <ColorPicker
        open={!!anchorEl}
        anchorEl={anchorEl}
        value={tag.colorHEX}
        onClose={() => setAnchorEl(null)}
        onChange={handleColorChange}
      />

      <TagEditDialog
        key={tag.id}
        open={showEditor}
        onClose={toggleEditor}
        tag={tag}
      />
    </Box>
  )
}

const CommentWidget: FC<{ id: string | null }> = props => {
  const id = String(props.id)
  const dispatch = useDispatch()
  const comment = useSelector(getTagComment(id))
  const [value, setValue] = useState(comment)
  const debouncedValue = useDebounce(value, 300)

  // Update comment only when debounced value updated
  useEffect(() => {
    if (comment !== debouncedValue) {
      dispatch(setTagComment(id, debouncedValue))
    }
  }, [debouncedValue, dispatch, id, comment])

  return (
    <InputBase
      sx={cardStyle}
      placeholder="Комментарий"
      value={value}
      onChange={e => setValue(e.target.value)}
      multiline
      startAdornment={
        <InputAdornment position="start" component="label">
          <NotesIcon />
        </InputAdornment>
      }
    />
  )
}
