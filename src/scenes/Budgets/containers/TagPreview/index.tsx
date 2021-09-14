import React, { FC, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { EmojiIcon } from 'components/EmojiIcon'
import { Box, Typography, IconButton } from '@mui/material'
import { Tooltip } from 'components/Tooltip'
import CloseIcon from '@mui/icons-material/Close'
import EditIcon from '@mui/icons-material/Edit'
import { getPopulatedTag } from 'store/localData/tags'
import { Total, Line as TextLine } from '../components'
import { getAmountsById } from 'scenes/Budgets/selectors/getAmountsByTag'
import Rhythm from 'components/Rhythm'
import { useMonth } from 'scenes/Budgets/pathHooks'
import { LinkedAccs } from './LinkedAccs'
import { OutcomeWidget } from './OutcomeWidget'
import { ColorPicker } from 'components/ColorPickerPopover'
import { hexToInt } from 'helpers/convertColor'
import { patchTag } from 'store/localData/tags/thunks'
import { sendEvent } from 'helpers/tracking'
import { PopulatedTag } from 'types'
import { TagEditDialog } from 'components/TagEditDialog'
import { useToggle } from 'helpers/useToggle'

type TagPreviewProps = {
  id: string
  onClose: () => void
}

export const TagPreview: FC<TagPreviewProps> = ({ onClose, id }) => {
  const [month] = useMonth()
  const tag = useSelector(state => getPopulatedTag(state, id))
  const amounts = useSelector(getAmountsById)?.[month]?.[id]
  if (!amounts) return null
  const isParent = !!amounts.children

  const {
    // available,
    // totalAvailable,
    leftover,
    totalLeftover,
    budgeted,
    totalBudgeted,
    // children,
    // childrenAvailable,
    // childrenBudgeted,
    // childrenIncome,
    // childrenLeftover,
    // childrenOutcome,
    // childrenOverspent,
    // income,
    outcome,
    // tagOutcome,
    // totalIncome,
    totalOutcome,
    // totalOverspent,
    transferOutcome,
  } = amounts

  const available = amounts.totalAvailable || amounts.available

  return (
    <Box>
      <Header tag={tag} onClose={onClose} />

      <Box px={3} mt={3} display="flex" justifyContent="space-around">
        <Total name="Доступно" value={available} />
        <Total name="Расход" value={isParent ? totalOutcome : outcome} />
      </Box>

      <Rhythm gap={1.5} px={3} mt={3}>
        <OutcomeWidget tagId={id} mx={-1} />
        <TextLine
          name="Остаток с прошлого месяца"
          amount={isParent ? totalLeftover : leftover}
        />
        <TextLine name="Бюджет" amount={isParent ? totalBudgeted : budgeted} />
        <TextLine name="Расход" amount={isParent ? totalOutcome : outcome} />
        <TextLine name="       Переводы" amount={transferOutcome} />
        <Box my={5}>
          <LinkedAccs id={id} />
        </Box>
      </Rhythm>
    </Box>
  )
}

type HeaderProps = {
  tag: PopulatedTag
  onClose: () => void
}

const Header: FC<HeaderProps> = ({ tag, onClose }) => {
  const [anchorEl, setAnchorEl] = useState<Element | null>(null)
  const [showEditor, toggleEditor] = useToggle()
  const dispatch = useDispatch()
  const handleColorChange = (hex?: string | null) => {
    sendEvent('Tag: set color: ' + hex)
    dispatch(patchTag({ id: tag.id, color: hexToInt(hex) }))
  }
  return (
    <Box py={1} px={3} display="flex" alignItems="center">
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
