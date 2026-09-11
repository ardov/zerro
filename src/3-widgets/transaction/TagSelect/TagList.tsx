import { IconButton } from '@/6-shared/ui/Button'
import type { FC } from 'react'
import { useLayoutEffect, useRef } from 'react'
import type { HTMLAttributes } from 'react'
import { cn } from '@/6-shared/ui/shadcn/utils'
import { Tooltip } from '@/6-shared/ui/Tooltip'
import { AddIcon } from '@/6-shared/ui/Icons'
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
  const listRef = useRef<HTMLDivElement>(null)
  const focusAfterRemoval = useRef<HTMLElement | null>(null)
  useLayoutEffect(() => {
    if (!focusAfterRemoval.current) return
    focusAfterRemoval.current.focus()
    focusAfterRemoval.current = null
  }, [tags])
  const removeTag = (removeId: string) => {
    const chip =
      listRef.current?.querySelectorAll<HTMLElement>('[data-slot="chip"]')[
        tags?.indexOf(removeId) ?? -1
      ]
    if (chip?.contains(document.activeElement)) {
      const next = chip.nextElementSibling ?? chip.previousElementSibling
      focusAfterRemoval.current = next?.matches('button')
        ? (next as HTMLElement)
        : (next?.querySelector<HTMLElement>('button') ?? null)
    }
    if (tags) onChange(tags.filter(id => id !== removeId))
  }
  const replaceTag = (oldId: string, newId: string) =>
    tags && onChange(tags.map(id => (id === oldId ? newId : id)))
  const addTag = (id: string) => onChange(tags ? [...tags, id] : [id])

  return (
    <div ref={listRef} className={cn(className)} {...rest}>
      {tags?.map(id => (
        <TagSelect2
          key={id}
          onChange={newId => replaceTag(id, newId)}
          exclude={tags}
          tagType={tagType}
          trigger={
            <TagChip
              id={id}
              className="my-1 mr-2"
              onDelete={() => removeTag(id)}
            />
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
                children={<AddIcon size={20} />}
              />
            </Tooltip>
          </span>
        }
      />
    </div>
  )
}
