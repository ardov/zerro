import type { FC } from 'react'
import type { BoxProps } from '@mui/material'
import { Box, IconButton } from '@mui/material'
import { Tooltip } from '6-shared/ui/Tooltip'
import { AddIcon } from '6-shared/ui/Icons'
import type { Modify } from '6-shared/types'
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
            <span className="my-1 mr-2 inline-block">
              <TagChip id={id} onDelete={() => removeTag(id)} />
            </span>
          }
        />
      ))}
      <TagSelect2
        onChange={id => addTag(id)}
        exclude={tags}
        tagType={tagType}
        trigger={
          <span className="my-1 inline-block">
            <Tooltip title={t('addCategory')}>
              <IconButton
                edge="end"
                size="small"
                children={<AddIcon fontSize="inherit" />}
              />
            </Tooltip>
          </span>
        }
      />
    </Box>
  )
}
