import { FC } from 'react'
import { useAppSelector } from 'store'
import { core } from 'zerro-core/redux'

import { TagTreeNode, TTagPopulated } from '5-entities/tag'
import { getTagsTree } from '5-entities/tag/model/model'
import { Box, Autocomplete, TextField } from '@mui/material'
import { TagIcon } from '6-shared/ui/TagIcon'
import { TagChip } from './TagChip'
import ru from 'convert-layout/ru'

type TagFilters = {
  tagType?: 'income' | 'outcome'
  includeNull?: boolean
  topLevel?: boolean
  exclude?: string[]
}

type BaseTagSelectProps =
  | {
      multiple?: false
      onChange: (v: string | null) => void
      value?: string | null
    }
  | {
      multiple: true
      onChange: (v: string[] | null) => void
      value?: string[]
    }

export type TagSelectProps = BaseTagSelectProps & {
  tagFilters?: TagFilters
  label?: string
}

type TagOption = TTagPopulated | TagTreeNode

export const TagSelect: FC<TagSelectProps> = props => {
  const { onChange, tagFilters, multiple, value, label, ...rest } = props
  const tagsTree = useAppSelector(getTagsTree)
  const tags = useAppSelector(core.tags.selectPopulated)
  const options = getMatchedTags(tagsTree, tagFilters)

  return (
    <Autocomplete<string, typeof multiple>
      multiple={multiple}
      value={value}
      onChange={(e, value) => {
        if (!onChange) return
        if (!value) return onChange(null)
        // Хз как заставить его нормально работать
        // @ts-expect-error value type depends on the multiple flag
        return onChange(value)
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
          <TagIcon
            symbol={tags[tag].symbol}
            mr={2}
            ml={tags[tag].parent ? 5 : 0}
          />
          {tags[tag].name}
        </Box>
      )}
      renderTags={(tags, getTagProps) =>
        tags.map((tag, index) => {
          const { key, ...tagProps } = getTagProps({ index })
          return <TagChip key={key} id={tag} {...tagProps} />
        })
      }
      renderInput={params => (
        <TextField
          {...params}
          label={label}
          slotProps={{
            htmlInput: {
              ...params.inputProps,
              autoComplete: 'new-password', // disable autocomplete and autofill
            },
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

const makeChecker =
  (search = '', filters?: TagFilters) =>
  (tag: TagOption) => {
    const { tagType, includeNull, topLevel, exclude } = filters || {}
    if (tag.id === 'null') return includeNull ? true : false
    if (exclude?.includes(tag.id)) return false
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
