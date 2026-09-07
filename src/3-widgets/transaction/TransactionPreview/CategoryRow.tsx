import type { FC, MouseEventHandler } from 'react'
import { useTranslation } from 'react-i18next'
import type { TTagId } from '@/6-shared/types'
import { CloseIcon, AddIcon } from '@/6-shared/ui/Icons'
import { cn } from '@/6-shared/ui/shadcn/utils'
import { getContrastText } from '@/6-shared/ui/theme/color'
import { useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'
import { TagSelect2 } from '../TagSelect/TagSelect2'

/** How wide the trailing plus is, so the same width can be reserved on the
 * other side. Without it the chips would sit left of centre by half a button
 * as soon as one is chosen. */
const plusWidth = 'w-7'

export type CategoryRowProps = {
  tags: TTagId[] | null
  onChange: (tags: TTagId[]) => void
  tagType: 'income' | 'outcome'
  className?: string
}

/** The transaction's categories, as chips under the amount.
 *
 * With none chosen the row is a single dashed chip inviting one, which is
 * both the empty state and the control. With one chosen the chip takes the
 * category's own colour, and a muted plus appears beside it for the next. */
export const CategoryRow: FC<CategoryRowProps> = ({
  tags,
  onChange,
  tagType,
  className,
}) => {
  const { t } = useTranslation()
  const chosen = tags ?? []
  const remove = (id: TTagId) => onChange(chosen.filter(tag => tag !== id))
  const replace = (from: TTagId, to: TTagId) =>
    onChange(chosen.map(tag => (tag === from ? to : tag)))

  if (!chosen.length) {
    return (
      <div className={cn('flex flex-wrap justify-center', className)}>
        <TagSelect2
          onChange={id => onChange([id])}
          tagType={tagType}
          trigger={
            <button
              type="button"
              className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-full border border-dashed border-border-strong bg-transparent px-3 text-body-sm text-muted-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <AddIcon size={16} />
              {t('addCategory')}
            </button>
          }
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-center gap-1',
        className
      )}
    >
      {/* Balances the plus at the far end. */}
      <span aria-hidden className={cn(plusWidth, 'shrink-0')} />
      {chosen.map(id => (
        <TagSelect2
          key={id}
          onChange={next => replace(id, next)}
          exclude={chosen}
          tagType={tagType}
          trigger={<CategoryChip id={id} onDelete={() => remove(id)} />}
        />
      ))}
      <TagSelect2
        onChange={id => onChange([...chosen, id])}
        exclude={chosen}
        tagType={tagType}
        trigger={
          <button
            type="button"
            aria-label={t('addCategory')}
            className={cn(
              plusWidth,
              'inline-flex h-7 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-muted-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
            )}
          >
            <AddIcon size={20} />
          </button>
        }
      />
    </div>
  )
}

/** One category, painted with its own colour, or grey when it has none.
 *
 * The chip is a button that changes the category and carries a second one
 * that takes it off — so the cross is a `span` with a click of its own rather
 * than a nested button, which is not something a browser will render. */
const CategoryChip: FC<{
  id: TTagId
  onDelete: () => void
  /** Supplied by the category picker this chip is the trigger for. */
  onClick?: MouseEventHandler
}> = ({ id, onDelete, onClick }) => {
  const { t } = useTranslation()
  const tag = useAppSelector(core.tags.selectPopulated)[id]
  const label = id === 'mixed' ? t('mixedCategories') : (tag?.name ?? id)
  const color = tag?.colorHEX

  return (
    <span
      className={cn(
        'inline-flex h-8 max-w-full items-center gap-1.5 rounded-full pr-2 pl-3 text-body-sm',
        !color && 'bg-selected text-foreground'
      )}
      style={
        color
          ? { backgroundColor: color, color: getContrastText(color) }
          : undefined
      }
    >
      <button
        type="button"
        onClick={onClick}
        className="inline-flex min-w-0 cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-left text-inherit focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {tag && <CategorySymbol symbol={tag.symbol} />}
        <span className="truncate">{label}</span>
      </button>
      <button
        type="button"
        aria-label={t('removeValue', { label })}
        onClick={event => {
          event.stopPropagation()
          onDelete()
        }}
        className="inline-flex shrink-0 cursor-pointer items-center rounded-full border-0 bg-transparent p-0 text-inherit opacity-70 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <CloseIcon size={16} />
      </button>
    </span>
  )
}

/** The category's icon with nothing behind it. An SVG symbol is painted as a
 * mask so it takes the chip's own text colour, which is what lets one glyph
 * read on every category colour. */
const CategorySymbol: FC<{ symbol: string }> = ({ symbol }) => {
  const isSvg = symbol.startsWith('data:image/svg') || symbol.includes('.svg')
  if (!isSvg) {
    return (
      <span aria-hidden className="shrink-0 text-base leading-none">
        {symbol}
      </span>
    )
  }
  return (
    <span
      aria-hidden
      className="size-5 shrink-0 bg-current"
      style={{
        maskImage: `url("${symbol}")`,
        maskPosition: 'center',
        maskRepeat: 'no-repeat',
        maskSize: 'contain',
        WebkitMaskImage: `url("${symbol}")`,
        WebkitMaskPosition: 'center',
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskSize: 'contain',
      }}
    />
  )
}
