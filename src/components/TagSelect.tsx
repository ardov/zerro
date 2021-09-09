import React, { FC } from 'react'
import { useSelector } from 'react-redux'
import {
  getPopulatedTags,
  getTagsTree,
  TagTreeNode,
} from 'store/localData/tags'
import { Box, Autocomplete, TextField } from '@mui/material'
import { EmojiIcon } from 'components/EmojiIcon'
import { PopulatedTag } from '../types'
import TagChip from './TagChip'
import ru from 'convert-layout/ru'

type TagFilters = {
  tagType?: 'income' | 'outcome'
  includeNull?: boolean
  topLevel?: boolean
}

export type TagSelectProps = {
  onChange: (v: string[] | null) => void
  tagFilters?: TagFilters

  multiple?: boolean
  value?: string[]
  label?: string
}

type TagOption = PopulatedTag | TagTreeNode

export const TagSelect: FC<TagSelectProps> = props => {
  const { onChange, tagFilters, multiple, value, ...rest } = props
  const tagsTree = useSelector(getTagsTree)
  const tags = useSelector(getPopulatedTags)
  const options = getMatchedTags(tagsTree, tagFilters)

  return (
    <Autocomplete
      multiple={multiple}
      value={value}
      onChange={(e, value) => {
        if (!onChange) return
        if (!value) return onChange(null)
        if (Array.isArray(value)) {
          return onChange(value)
        } else {
          return onChange([value])
        }
      }}
      openOnFocus
      options={options}
      autoHighlight
      filterOptions={(_, state) =>
        getMatchedTags(tagsTree, tagFilters, state.inputValue)
      }
      getOptionLabel={tag => tags[tag].name}
      renderOption={(props, tag) => (
        <Box component="li" {...props}>
          <EmojiIcon
            symbol={tags[tag].symbol}
            mr={2}
            ml={tags[tag].parent ? 5 : 0}
          />
          {tags[tag].name}
        </Box>
      )}
      renderTags={(tags, getTagProps) =>
        tags.map((tag, index) => (
          <TagChip id={tag} {...getTagProps({ index })} />
        ))
      }
      renderInput={params => (
        <TextField
          {...params}
          label="Категория"
          inputProps={{
            ...params.inputProps,
            autoComplete: 'new-password', // disable autocomplete and autofill
          }}
        />
      )}
      {...rest}
    />
  )
}

const getMatchedTags = (
  tags: TagTreeNode[],
  filters?: TagFilters,
  search = ''
) => {
  const check = makeChecker(search, filters)
  let list: TagOption[] = []
  tags.forEach(parent => {
    const filteredCildren = parent.children.filter(check)
    if (filteredCildren.length) {
      list = [...list, parent, ...filteredCildren]
    } else if (check(parent)) {
      list.push(parent)
    }
  })
  return list.map(t => t.id)
}

const makeChecker = (search = '', filters?: TagFilters) => (tag: TagOption) => {
  const { tagType, includeNull, topLevel } = filters || {}
  if (tag.id === 'null') return includeNull ? true : false
  if (topLevel && tag.parent) return false
  if (search) return matchString(tag.name, search)
  if (tagType === 'income') return tag.showIncome
  if (tagType === 'outcome') return tag.showOutcome
  return true
}

const matchString = (name: string, search: string) => {
  const n = name.toLowerCase()
  const s = search.toLowerCase()
  return n.includes(s) || n.includes(ru.toEn(s)) || n.includes(ru.fromEn(s))
}
