import type { FC, KeyboardEventHandler } from 'react'
import React, { useEffect, useState, useRef } from 'react'
import { createSelector } from '@reduxjs/toolkit'
import { useAppSelector } from 'store'
import type { PopoverProps } from '@mui/material'
import {
  Popover,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  TextField,
} from '@mui/material'
import { AddIcon } from '6-shared/ui/Icons'
import { TagIcon } from '6-shared/ui/TagIcon'
import type { Modify } from '6-shared/types'
import { useTranslation } from 'react-i18next'
import { core } from 'zerro-core/redux'

type TTagPopulated = core.tags.TTagPopulated
type TagTreeNode = Modify<TTagPopulated, { children: TTagPopulated[] }>
const getTagsTree = createSelector([core.tags.selectPopulated], tags => {
  const result = []
  for (const id in tags) {
    if (tags[id].parent) continue
    const tag = { ...tags[id], children: [] } as TagTreeNode
    if (tags[id].children) {
      tag.children = tags[id].children
        .map(childId => tags[childId])
        .sort(compareTags)
    }
    result.push(tag)
  }
  result.sort(compareTags)
  return result
})

function compareTags<T extends { name: string }>(tag1: T, tag2: T) {
  return tag1.name.localeCompare(tag2.name)
}

type TagType = 'income' | 'outcome' | undefined | null
type TagNode = TagTreeNode | TTagPopulated
type TagSelectProps = {
  onChange: (id: string) => void
  trigger?: React.ReactElement<{ onClick?: React.MouseEventHandler }>
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

  const flatList: TagNode[] = []
  tags.forEach(tag => {
    if (checkTag(tag)) {
      flatList.push(tag)
      tag.children.forEach(child => {
        if (checkTag(child)) flatList.push(child)
      })
    }
  })

  const [prevOpen, setPrevOpen] = useState({ open, tagType })
  if (prevOpen.open !== open || prevOpen.tagType !== tagType) {
    setPrevOpen({ open, tagType })
    if (open) {
      setSearch('')
      setLocalTagType(tagType)
      setFocused(0)
    }
  }

  const [prevSearch, setPrevSearch] = useState(search)
  if (prevSearch !== search) {
    setPrevSearch(search)
    setFocused(0)
  }

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
      <div className="surface-card sticky top-0 z-10 rounded-none shadow-none px-2 pt-2">
        <TextField
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          variant="outlined"
          placeholder={t('selectCategory')}
          fullWidth
          autoFocus
        />
      </div>

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
      <TagIcon
        symbol={tag.symbol}
        className={isChild ? 'mr-4 ml-10' : 'mr-4 ml-0'}
      />
      <ListItemText primary={tag.name} />
    </ListItemButton>
  )
}

type ShowAllButtonProps = {
  onClick: () => void
  selected?: boolean
  label: string
}

const ShowAllButton: FC<ShowAllButtonProps> = ({
  onClick,
  selected,
  label,
}) => {
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
    if (!showNull && tag.id === core.tags.nullTag.id) return false
    if (search) return checkSearch(tag, search)
    if (tagType === 'income') return !!tag.showIncome
    if (tagType === 'outcome') return !!tag.showOutcome
    return true
  }
}

const includes = (str: string, search: string) =>
  str.toUpperCase().includes(search.toUpperCase())
