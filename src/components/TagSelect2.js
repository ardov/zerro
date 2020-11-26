import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { getTagsTree } from 'store/localData/tags'
import {
  Popover,
  Paper,
  IconButton,
  Box,
  List,
  ListItem,
  ListItemText,
  TextField,
} from '@material-ui/core'
import AddIcon from '@material-ui/icons/Add'
import EmojiIcon from 'components/EmojiIcon'

export default function TagSelect({
  onChange,
  trigger,
  value,
  exclude,
  tagType,
}) {
  const [anchorEl, setAnchorEl] = useState(null)
  const handleClick = e => setAnchorEl(e.currentTarget)
  const handleClose = () => setAnchorEl(null)
  const handleTagSelect = id => {
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

function makeTagChecker({
  search = '',
  tagType = null,
  exclude = [],
  showNull = false,
}) {
  const checkSearch = (tag, search) => {
    const includes = (title, search) =>
      title.toUpperCase().includes(search.toUpperCase())
    if (includes(tag.title, search)) return true
    return (
      tag.children && tag.children.some(child => includes(child.title, search))
    )
  }
  return function (tag) {
    // never show excluded tags
    if (exclude?.includes(tag.id)) return false
    if (!showNull && tag.id === null) return false
    if (search) return checkSearch(tag, search)
    if (tagType === 'income') return tag.showIncome
    if (tagType === 'outcome') return tag.showOutcome
    return true
  }
}

// WIP
function TagSelectPopover({
  open,
  anchorEl,
  exclude,
  tagType,
  selectedIds,
  showNull = false,
  onTagSelect,
  onClose,
  ...popoverProps
}) {
  const tags = useSelector(getTagsTree)
  const [search, setSearch] = useState('')
  const [focused, setFocused] = useState(0)
  const [localTagType, setLocalTagType] = useState(tagType)
  const checkTag = makeTagChecker({
    search,
    tagType: localTagType,
    exclude,
    showNull,
  })

  let flatList = []
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
    }
  }, [open, tagType])

  useEffect(() => {
    setFocused(0)
  }, [search])

  const handleClick = id => () => onTagSelect(id)

  const handleKeyDown = e => {
    if (e.key === 'ArrowUp' || e.keyCode === 38) {
      e.preventDefault()
      if (focused > 0) setFocused(focused => focused - 1)
    }
    if (e.key === 'ArrowDown' || e.keyCode === 40) {
      e.preventDefault()
      if (focused < flatList.length - 1) setFocused(focused => focused + 1)
    }
    if (e.key === 'Enter' || e.keyCode === 13) {
      e.preventDefault()
      if (flatList.length) onTagSelect(flatList[focused].id)
    }
    if (e.key === 'Escape' || e.keyCode === 27) {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      {...popoverProps}
    >
      <Box pt={1} px={1} position="sticky" top={0} zIndex={10} clone>
        <Paper square elevation={0}>
          <TextField
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            variant="outlined"
            placeholder="Выберите категорию"
            fullWidth
            autoFocus
          />
        </Paper>
      </Box>
      <List>
        {flatList.map((tag, idx) => (
          <TagOption
            key={tag.id}
            tag={tag}
            onClick={handleClick(tag.id)}
            selected={selectedIds?.find(tag.id) || focused === idx}
            isChild={!!tag.parent}
          />
        ))}
        {localTagType && !search && (
          <ListItem button onClick={() => setLocalTagType(null)}>
            Показать все категории
          </ListItem>
        )}
      </List>
    </Popover>
  )
}

function TagOption({ tag, isChild, ...rest }) {
  return (
    <ListItem button {...rest}>
      <EmojiIcon symbol={tag.symbol} mr={2} ml={isChild ? 5 : 0} />
      <ListItemText primary={tag.name}></ListItemText>
    </ListItem>
  )
}
