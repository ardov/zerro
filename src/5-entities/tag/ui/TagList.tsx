import React, { FC } from 'react'
import { Box, BoxProps, IconButton } from '@mui/material'
import { Tooltip } from '6-shared/ui/Tooltip'
import { AddIcon } from '6-shared/ui/Icons'
import { Modify } from '6-shared/types'
import { TagSelect2 } from './TagSelect2'
import { TagChip } from './TagChip'
import { useTranslation } from 'react-i18next'

type TagListProps = Modify<
  BoxProps,
  {
    tags: string[] | null
    onChange: (tags: string[]) => void
    tagType: 'income' | 'outcome' | null
  }
>
export const TagList: FC<TagListProps> = props => {
  const { t } = useTranslation()
  const { tags = null, onChange, tagType, ...rest } = props
  const removeTag = (removeId: string) =>
    tags && onChange(tags.filter(id => id !== removeId))
  const replaceTag = (oldId: string, newId: string) =>
    tags && onChange(tags.map(id => (id === oldId ? newId : id)))
  const addTag = (id: string) => onChange(tags ? [...tags, id] : [id])

  return (
    <Box {...rest}>
      {tags?.map(id => (
        <TagSelect2
          key={id}
          onChange={newId => replaceTag(id, newId)}
          exclude={tags}
          tagType={tagType}
          trigger={
            <Box sx={{ mr: 1, my: 0.5, display: 'inline-block' }}>
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
          <Box sx={{ my: 0.5, display: 'inline-block' }}>
            <Tooltip title={t('addCategory')}>
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
