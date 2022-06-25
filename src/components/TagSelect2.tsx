import React, { FC, KeyboardEventHandler, useEffect, useState } from 'react'
import { useAppSelector } from 'store'
import { getTagsTree, TagTreeNode } from 'store/data/tags'
import {
  Popover,
  Paper,
  IconButton,
  List,
  ListItem,
  ListItemText,
  TextField,
  PopoverProps,
  ListItemProps,
} from '@mui/material'
import { AddIcon } from 'shared/ui/Icons'
import { EmojiIcon } from 'shared/ui/EmojiIcon'
import { TTag } from 'shared/types'

type TagType = 'income' | 'outcome' | undefined | null
type TagNode = TagTreeNode | TTag
type TagSelectProps = {
  onChange: (id: string) => void
  trigger?: React.ReactElement
  value?: string[] | null
  exclude?: string[] | null
  tagType?: TagType
}

export const TagSelect: FC<TagSelectProps> = props => {
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
export default TagSelect

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
  const tags = useAppSelector(getTagsTree)
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
    }
  }, [open, tagType])

  useEffect(() => {
    setFocused(0)
  }, [search])

  const handleClick = (id: string) => () => onTagSelect(id)

  const handleKeyDown: KeyboardEventHandler = e => {
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
          placeholder="Выберите категорию"
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
            selected={selectedIds?.includes(tag.id) || focused === idx}
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

type TagOptionProps = ListItemProps & {
  tag: TagNode
  isChild?: boolean
}
const TagOption: FC<TagOptionProps> = props => {
  const { tag, isChild, ...rest } = props
  const button = true as any // need any due to https://github.com/mui-org/material-ui/issues/14971
  return (
    <ListItem button={button} {...rest}>
      <EmojiIcon symbol={tag.symbol} mr={2} ml={isChild ? 5 : 0} />
      <ListItemText primary={tag.name}></ListItemText>
    </ListItem>
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
    const children = tag.children as TTag[]
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
