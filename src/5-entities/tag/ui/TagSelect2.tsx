import React, { FC, KeyboardEventHandler, useEffect, useState, useRef } from 'react'
import { tagModel, TagTreeNode, TTagPopulated } from '5-entities/tag'
import {
  Popover,
  Paper,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  TextField,
  PopoverProps,
  ListItemProps,
} from '@mui/material'
import { AddIcon } from '6-shared/ui/Icons'
import { EmojiIcon } from '6-shared/ui/EmojiIcon'
import { useTranslation } from 'react-i18next'

type TagType = 'income' | 'outcome' | undefined | null
type TagNode = TagTreeNode | TTagPopulated
type TagSelectProps = {
  onChange: (id: string) => void
  trigger?: React.ReactElement
  value?: string[] | null
  exclude?: string[] | null
  tagType?: TagType
}

export const TagSelect2: FC<TagSelectProps> = props => {
  const { onChange, trigger, value, exclude, tagType } = props
  const [anchorEl, setAnchorEl] = useState<Element | null>(null)
  const handleClick: React.MouseEventHandler = e => setAnchorEl(e.currentTarget)
  const handleClose = () => setAnchorEl(null)
  const handleTagSelect = (id: string) => {
    setAnchorEl(null)
    onChange(id)
  }
  const open = Boolean(anchorEl)

  return (
    <>
      {trigger ? (
        React.cloneElement(trigger, { onClick: handleClick })
      ) : (
        <IconButton onClick={handleClick}>
          <AddIcon />
        </IconButton>
      )}
      <TagSelectPopover
        {...{ open, anchorEl, exclude, tagType }}
        onClose={handleClose}
        onTagSelect={handleTagSelect}
        selectedIds={value}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      />
    </>
  )
}

type TagSelectPopoverProps = PopoverProps & {
  exclude?: string[] | null
  tagType?: TagType
  selectedIds?: string[] | null
  onTagSelect: (id: string) => void
  showNull?: boolean
}

const TagSelectPopover: FC<TagSelectPopoverProps> = ({
  open,
  anchorEl,
  exclude,
  tagType,
  selectedIds,
  showNull = false,
  onTagSelect,
  onClose,
  ...popoverProps
}) => {
  const { t } = useTranslation('common')
  const tags = tagModel.useTagsTree()
  const [search, setSearch] = useState('')
  const [focused, setFocused] = useState(0)
  const [localTagType, setLocalTagType] = useState(tagType)
  const checkTag = makeTagChecker({
    search,
    tagType: localTagType,
    exclude,
    showNull,
  })

  let flatList: TagNode[] = []
  tags.forEach(tag => {
    if (checkTag(tag)) {
      flatList.push(tag)
      tag.children.forEach(child => {
        if (checkTag(child)) flatList.push(child)
      })
    }
  })

  useEffect(() => {
    if (open) {
      setSearch('')
      setLocalTagType(tagType)
      setFocused(0)
    }
  }, [open, tagType])

  useEffect(() => {
    setFocused(0)
  }, [search])

  const handleClick = (id: string) => () => onTagSelect(id)

  const showAllButton = localTagType && !search
  const maxFocusIndex = showAllButton ? flatList.length : flatList.length - 1

  const handleKeyDown: KeyboardEventHandler = e => {
    if (e.key === 'ArrowUp' || e.keyCode === 38) {
      e.preventDefault()
      if (focused > 0) setFocused(focused => focused - 1)
    }
    if (e.key === 'ArrowDown' || e.keyCode === 40) {
      e.preventDefault()
      if (focused < maxFocusIndex) setFocused(focused => focused + 1)
    }
    if (e.key === 'Enter' || e.keyCode === 13) {
      e.preventDefault()
      if (focused === flatList.length && showAllButton) {
        setLocalTagType(null)
      } else if (flatList.length) {
        onTagSelect(flatList[focused].id)
      }
    }
    if (e.key === 'Escape' || e.keyCode === 27) {
      e.preventDefault()
      onClose?.(e, 'escapeKeyDown')
    }
  }

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      {...popoverProps}
    >
      <Paper
        square
        elevation={0}
        sx={{ pt: 1, px: 1, position: 'sticky', top: 0, zIndex: 10 }}
      >
        <TextField
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          variant="outlined"
          placeholder={t('selectCategory')}
          fullWidth
          autoFocus
        />
      </Paper>

      <List>
        {flatList.map((tag, idx) => (
          <TagOption
            key={tag.id}
            tag={tag}
            onClick={handleClick(tag.id)}
            isChild={!!tag.parent}
            selected={idx === focused}
          />
        ))}
        {showAllButton && (
          <ShowAllButton
            onClick={() => setLocalTagType(null)}
            selected={focused === flatList.length}
            label={t('showAllCategories')}
          />
        )}
      </List>
    </Popover>
  )
}

type TagOptionProps = {
  tag: TagNode
  isChild?: boolean
  onClick: () => void
  selected?: boolean
}

const TagOption: FC<TagOptionProps> = ({ tag, isChild, onClick, selected }) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selected && ref.current) {
      ref.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [selected])

  return (
    <ListItemButton ref={ref} onClick={onClick} selected={selected}>
      <EmojiIcon symbol={tag.symbol} mr={2} ml={isChild ? 5 : 0} />
      <ListItemText primary={tag.name} />
    </ListItemButton>
  )
}

type ShowAllButtonProps = {
  onClick: () => void
  selected?: boolean
  label: string
}

const ShowAllButton: FC<ShowAllButtonProps> = ({ onClick, selected, label }) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selected && ref.current) {
      ref.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [selected])

  return (
    <ListItemButton ref={ref} onClick={onClick} selected={selected}>
      <ListItemText primary={label} />
    </ListItemButton>
  )
}

const makeTagChecker = (props: {
  search?: string
  tagType?: TagType
  exclude?: string[] | null
  showNull?: boolean
}) => {
  const { search = '', tagType = null, exclude = [], showNull = false } = props
  const checkSearch = (tag: TagNode, search: string) => {
    if (includes(tag.title, search)) return true
    const children = tag.children as TTagPopulated[]
    return children?.some(child => includes(child.title, search))
  }
  return function (tag: TagNode) {
    // never show excluded tags
    if (exclude?.includes(tag.id)) return false
    if (!showNull && tag.id === null) return false
    if (search) return checkSearch(tag, search)
    if (tagType === 'income') return !!tag.showIncome
    if (tagType === 'outcome') return !!tag.showOutcome
    return true
  }
}

const includes = (str: string, search: string) =>
  str.toUpperCase().includes(search.toUpperCase())
