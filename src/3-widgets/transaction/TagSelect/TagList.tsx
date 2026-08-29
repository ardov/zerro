import { IconButton } from '6-shared/ui/Button'
import type { FC } from 'react'
import type { HTMLAttributes } from 'react'
import { cn } from '6-shared/ui/shadcn/utils'
import { Tooltip } from '6-shared/ui/Tooltip'
import { AddIcon } from '6-shared/ui/Icons'
import { TagSelect2 } from './TagSelect2'
import { TagChip } from './TagChip'
import { useTranslation } from 'react-i18next'

type TagListProps = Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> & {
  tags: string[] | null
  onChange: (tags: string[]) => void
  tagType: 'income' | 'outcome' | null
}
export const TagList: FC<TagListProps> = props => {
  const { t } = useTranslation()
  const { tags = null, onChange, tagType, className, ...rest } = props
  const removeTag = (removeId: string) =>
    tags && onChange(tags.filter(id => id !== removeId))
  const replaceTag = (oldId: string, newId: string) =>
    tags && onChange(tags.map(id => (id === oldId ? newId : id)))
  const addTag = (id: string) => onChange(tags ? [...tags, id] : [id])

  return (
    <div className={cn(className)} {...rest}>
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
    </div>
  )
}
