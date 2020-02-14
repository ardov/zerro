import React from 'react'
import { connect } from 'react-redux'
import { getTagsTree, getPopulatedTags } from 'store/localData/tags'
import { Box, Select, OutlinedInput, Chip, MenuItem } from '@material-ui/core'
import EmojiIcon from 'components/EmojiIcon'

function TagSelect({
  tags,
  tagList,
  onChange,
  incomeOnly,
  outcomeOnly,
  value,
  single,
  dispatch,
  ...rest
}) {
  const [open, setOpen] = React.useState(false)
  const handleTagSelect = e => {
    handleClose()
    onChange(e.target.value)
  }
  const handleClose = () => setOpen(false)
  const handleOpen = () => setOpen(true)
  // const removeTag = idToRemove => () =>
  //   onChange(value.filter(id => id !== idToRemove))

  const checkTag = tag =>
    (!incomeOnly || tag.showIncome) && (!outcomeOnly || tag.showOutcome)

  const filtered = tags
    .filter(checkTag)
    .map(tag =>
      tag.children ? { ...tag, children: tag.children.filter(checkTag) } : tag
    )

  return (
    <Select
      multiple={!single}
      open={open}
      onClose={handleClose}
      onOpen={handleOpen}
      value={value || []}
      onChange={handleTagSelect}
      input={<OutlinedInput fullWidth variant="outlined" />}
      renderValue={selected =>
        selected.map ? (
          <Box display="flex" flexWrap="wrap">
            {selected.map(id => (
              <Box m={0.25} key={id} clone>
                <Chip label={tagList[id] && tagList[id].title} />
              </Box>
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

export default connect(
  state => ({
    tags: getTagsTree(state),
    tagList: getPopulatedTags(state),
  }),
  null
)(TagSelect)
