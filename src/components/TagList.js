import React from 'react'
import { Box, IconButton } from '@material-ui/core'
import TagSelect2 from 'components/TagSelect2'
import TagChip from 'components/TagChip'
import { Tooltip } from 'components/Tooltip'
import AddIcon from '@material-ui/icons/Add'

export function TagList({ tags = null, onChange, tagType, ...rest }) {
  const removeTag = removeId =>
    tags && onChange(tags.filter(id => id !== removeId))
  const replaceTag = (oldId, newId) =>
    tags && onChange(tags.map(id => (id === oldId ? newId : id)))
  const addTag = id => onChange(tags ? [...tags, id] : [id])

  return (
    <Box {...rest}>
      {tags.map(id => (
        <TagSelect2
          key={id}
          onChange={newId => replaceTag(id, newId)}
          exclude={tags}
          tagType={tagType}
          trigger={
            <Box mr={1} my={0.5} display="inline-block">
              <TagChip id={id} onDelete={() => removeTag(id)} />
            </Box>
          }
        />
      ))}
      <TagSelect2
        onChange={id => addTag(id)}
        exclude={tags}
        tagType={tagType}
        trigger={
          <Box my={0.5} display="inline-block">
            <Tooltip title="Добавить категорию">
              <IconButton
                edge="end"
                size="small"
                children={<AddIcon fontSize="inherit" />}
              />
            </Tooltip>
          </Box>
        }
      />
    </Box>
  )
}
