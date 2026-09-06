import { Combobox } from '@base-ui/react/combobox'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckIcon, ChevronDownIcon, CloseIcon } from './Icons'
import { ListRowBacking, listRowClass } from './ListRow'
import { OutlinedFieldFrame } from './OutlinedField'
import { popupPositioning, overlaySurfaceClass } from './overlaySurface'
import { cn } from './shadcn/utils'
import { useScrollFade } from './useScrollFade'

export type MultiComboboxOption<T extends string> = {
  value: T
  label: ReactNode
}

type MultiComboboxProps<T extends string> = {
  label: string
  value: T[]
  onChange: (value: T[]) => void
  options: MultiComboboxOption<T>[]
  open: boolean
  onOpenChange: (open: boolean) => void
  autoFocus?: boolean
  emptyText?: ReactNode
}

/** A filterable multiple-select field. Unlike an autocomplete, its input only
 * narrows a fixed set of values: committing text never creates a filter value. */
export function MultiCombobox<T extends string>(props: MultiComboboxProps<T>) {
  const { t } = useTranslation()
  const fadeRef = useScrollFade<HTMLDivElement>()
  const selected = props.options.filter(option =>
    props.value.includes(option.value)
  )

  return (
    <Combobox.Root
      multiple
      items={props.options}
      value={selected}
      open={props.open}
      onOpenChange={props.onOpenChange}
      onValueChange={next => props.onChange(next.map(option => option.value))}
    >
      <OutlinedFieldFrame label={props.label} shrink fullWidth>
        <Combobox.InputGroup className="flex min-h-[56px] w-full flex-wrap items-center gap-1 py-1 pr-8">
          <Combobox.Chips className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
            <Combobox.Value>
              {(values: MultiComboboxOption<T>[]) => (
                <>
                  {values.map(option => (
                    <Combobox.Chip
                      key={option.value}
                      aria-label={String(option.label)}
                      className="group flex min-h-6 max-w-full items-center gap-1 rounded-sm bg-selected px-1.5 type-body-sm text-selected-foreground focus-within:bg-primary focus-within:text-primary-foreground data-highlighted:bg-primary data-highlighted:text-primary-foreground"
                    >
                      <span className="truncate">{option.label}</span>
                      <Combobox.ChipRemove
                        aria-label={t('removeValue', { label: option.label })}
                        className="inline-flex size-4 shrink-0 items-center justify-center rounded-sm border-0 bg-transparent p-0 text-inherit hover:bg-foreground-hover focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
                      >
                        <CloseIcon size={20} />
                      </Combobox.ChipRemove>
                    </Combobox.Chip>
                  ))}
                  <Combobox.Input
                    autoFocus={props.autoFocus}
                    aria-label={props.label}
                    className="m-0 min-h-6 min-w-16 flex-1 border-0 bg-transparent p-0 font-sans text-base leading-6 text-current outline-none"
                  />
                </>
              )}
            </Combobox.Value>
          </Combobox.Chips>
          <Combobox.Trigger
            aria-label={t('openOptions', { label: props.label })}
            className="absolute right-1 inline-flex size-8 items-center justify-center rounded-[50%] border-0 bg-transparent p-0 text-icon-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ChevronDownIcon />
          </Combobox.Trigger>
        </Combobox.InputGroup>
      </OutlinedFieldFrame>

      <Combobox.Portal>
        <Combobox.Positioner
          {...popupPositioning}
          side="bottom"
          align="start"
          sideOffset={4}
          style={{ minWidth: 'var(--anchor-width)' }}
        >
          <Combobox.Popup
            ref={fadeRef}
            className={cn(
              overlaySurfaceClass,
              '[--grow-from:0.95] max-h-[min(22.5rem,var(--available-height))]'
            )}
          >
            {props.emptyText && (
              <Combobox.Empty>
                <div className="px-2 py-3 type-body-sm text-muted-foreground">
                  {props.emptyText}
                </div>
              </Combobox.Empty>
            )}
            <Combobox.List className="outline-none">
              {option => (
                <Combobox.Item
                  key={option.value}
                  value={option}
                  className={listRowClass}
                >
                  <ListRowBacking
                    selected={props.value.includes(option.value)}
                  />
                  <Combobox.ItemIndicator className="mr-2 inline-flex size-4 shrink-0 items-center justify-center text-primary">
                    <CheckIcon size={20} />
                  </Combobox.ItemIndicator>
                  <span className="min-w-0 flex-auto truncate">
                    {option.label}
                  </span>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  )
}
