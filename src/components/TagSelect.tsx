import React, { FC } from 'react'
import { useSelector } from 'react-redux'
import {
  getTagsTree,
  getPopulatedTags,
  TagTreeNode,
} from 'store/localData/tags'
import {
  Box,
  Select,
  OutlinedInput,
  Chip,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material'
import { EmojiIcon } from 'components/EmojiIcon'
import { PopulatedTag, TagId } from '../types'

type TagSelectValueType = TagId | TagId[]

type TagSelectProps = {
  value: TagSelectValueType | null
  onChange: (v: TagSelectValueType) => void
  incomeOnly?: boolean
  outcomeOnly?: boolean
  single?: boolean
}

const TagSelect: FC<TagSelectProps> = ({
  onChange,
  incomeOnly,
  outcomeOnly,
  value,
  single,
  ...rest
}) => {
  const tags = useSelector(getTagsTree)
  const tagList = useSelector(getPopulatedTags)
  const [open, setOpen] = React.useState(false)
  const handleTagSelect = (e: SelectChangeEvent<TagSelectValueType>) => {
    onChange(e.target.value)
    handleClose()
  }
  const handleClose = () => setOpen(false)
  const handleOpen = () => setOpen(true)
  // const removeTag = idToRemove => () =>
  //   onChange(value.filter(id => id !== idToRemove))

  const checkTag = (tag: PopulatedTag | TagTreeNode) =>
    (!incomeOnly || tag.showIncome) && (!outcomeOnly || tag.showOutcome)

  const filtered = tags
    .filter(checkTag)
    .map(tag =>
      tag.children ? { ...tag, children: tag.children.filter(checkTag) } : tag
    )

  return (
    <Select<TagSelectValueType>
      multiple={!single}
      open={open}
      onClose={handleClose}
      onOpen={handleOpen}
      value={value || []}
      onChange={handleTagSelect}
      input={<OutlinedInput fullWidth />}
      renderValue={selected =>
        Array.isArray(selected) ? (
          <Box display="flex" flexWrap="wrap">
            {selected.map(id => (
              <Chip
                key={id}
                label={tagList[id] && tagList[id].title}
                sx={{ m: 0.25 }}
              />
            ))}
          </Box>
        ) : (
          tagList[selected] && tagList[selected].title
        )
      }
      {...rest}
    >
      {filtered.map(tag => {
        const children = tag.children
          ? tag.children.map(tag => (
              <MenuItem key={tag.id} value={tag.id}>
                <EmojiIcon symbol={tag.symbol} mr={2} ml={5} />
                {tag.name}
              </MenuItem>
            ))
          : []
        return [
          <MenuItem key={tag.id} value={tag.id}>
            <EmojiIcon symbol={tag.symbol} mr={2} />
            {tag.name}
          </MenuItem>,
          ...children,
        ]
      })}
    </Select>
  )
}

export default TagSelect
