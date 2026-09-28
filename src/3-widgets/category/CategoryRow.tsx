import { useLayoutEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'
import type { TTagId } from '@/6-shared/types'
import { Chip } from '@/6-shared/ui/kit/Chip'
import { AddIcon } from '@/6-shared/ui/Icons'
import { cn } from '@/6-shared/ui/shadcn/utils'
import { CategorySelect } from './CategorySelect'
import { CategorySymbol } from '@/6-shared/ui/CategoryIcon'
import type { CategoryRowAction, PreferredCategoryType } from './model'

export type CategoryRowProps = {
  /** Concrete common prefix; the differing suffix is represented by mixed. */
  value: readonly TTagId[]
  mixed?: boolean
  onAction: (action: CategoryRowAction) => void
  preferredType?: PreferredCategoryType
  align?: 'start' | 'center'
  className?: string
}

export function CategoryRow(props: CategoryRowProps) {
  const {
    value,
    mixed = false,
    onAction,
    preferredType,
    align = 'start',
    className,
  } = props
  const { t } = useTranslation()
  const tags = useAppSelector(core.tags.selectPopulated)
  const chipRefs = useRef(new Map<number, HTMLElement>())
  const addRef = useRef<HTMLButtonElement>(null)
  const focusAfterRemoval = useRef<number | 'add' | null>(null)
  useLayoutEffect(() => {
    const index = focusAfterRemoval.current
    if (index === null) return
    focusAfterRemoval.current = null
    const target =
      (index !== 'add'
        ? (chipRefs.current.get(index) ?? chipRefs.current.get(index - 1))
        : null) ?? addRef.current
    target?.focus()
  })
  const remove = (index: number, tail: boolean) => {
    focusAfterRemoval.current = index
    onAction(
      tail ? { type: 'removeTail', from: index } : { type: 'remove', index }
    )
  }
  const empty = !value.length && !mixed
  const centered = align === 'center' && !empty && !mixed
  const add = (
    <CategorySelect
      preferredType={preferredType}
      excludeIds={value}
      onSelect={id => {
        focusAfterRemoval.current = 'add'
        onAction({ type: 'append', id })
      }}
      trigger={
        empty ? (
          <Chip ref={addRef} variant="outline-draft" start={<AddIcon />}>
            {t('addCategory')}
          </Chip>
        ) : (
          <button
            type="button"
            ref={addRef}
            aria-label={t('addCategory')}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-ui-secondary hover:bg-ui-highlight focusable"
          >
            <AddIcon size={20} />
          </button>
        )
      }
    />
  )
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-1',
        align === 'center' && 'justify-center',
        // Symmetric outer clearance keeps an out-of-flow Add inside the row.
        centered && 'px-9',
        className
      )}
    >
      {value.map((id, index) => {
        const tag = tags[id]
        const last = index === value.length - 1
        return (
          <div
            key={index}
            className="relative flex min-w-0 max-w-full items-center"
          >
            <CategorySelect
              value={id}
              preferredType={preferredType}
              excludeIds={value.filter((_, position) => position !== index)}
              onSelect={next => {
                if (next !== id && value.includes(next))
                  focusAfterRemoval.current = index
                onAction({ type: 'replace', index, id: next })
              }}
              trigger={
                <Chip
                  ref={node => {
                    if (node) chipRefs.current.set(index, node)
                    else chipRefs.current.delete(index)
                  }}
                  color={tag?.colorHEX ?? undefined}
                  start={
                    tag && (tag.icon || tag.name !== tag.title) ? (
                      <CategorySymbol symbol={tag.symbol} />
                    ) : undefined
                  }
                  onRemove={() => remove(index, false)}
                >
                  {tag?.name ?? id}
                </Chip>
              }
            />
            {last && !mixed && (
              // The last chip and Add move together. Centered Add has no layout weight.
              <div
                className={
                  centered ? 'absolute start-full top-0 ms-1' : 'ms-1 shrink-0'
                }
              >
                {add}
              </div>
            )}
          </div>
        )
      })}
      {mixed && (
        <CategorySelect
          preferredType={preferredType}
          excludeIds={value}
          onSelect={id => {
            focusAfterRemoval.current = value.length
            onAction({ type: 'replaceTail', from: value.length, id })
          }}
          trigger={
            <Chip
              ref={node => {
                if (node) chipRefs.current.set(value.length, node)
                else chipRefs.current.delete(value.length)
              }}
              variant="outline"
              onRemove={() => remove(value.length, true)}
            >
              {t('mixedCategories')}
            </Chip>
          }
        />
      )}
      {empty && add}
    </div>
  )
}
