import { useRef, useState, type ReactNode } from 'react'
import { Combobox } from '@base-ui/react/combobox'
import { Field } from '@base-ui/react/field'
import { Search } from 'lucide-react'
import type { SelectItem, SelectOption, SelectControlProps } from './Select'
import {
  useSelectField,
  flattenSelectItems as flatten,
  selectPanelOutset as panelOutset,
} from './useSelectField'
import { FieldAddon, FieldSurface, fieldControlClass } from './Field'
import { ListPanel } from './ListPanel'
import { ListRow, ListRowHeader, ListRowSeparator } from './ListRow'
import { Button } from './Button'
import { useListPanelPositioning } from './useListPanelPositioning'

export type SelectSearchOptions<T extends string> = {
  label?: string
  placeholder?: string
  autoFocus?: boolean
  /** Receives the full source. Return a filtered/ranked result; no second filter runs. */
  filter?: (
    items: readonly SelectItem<T>[],
    query: string
  ) => readonly SelectItem<T>[]
  /** Initially show this many options. Search always covers the full source. */
  limit?: number
  showMoreLabel?: string
  /** Consumer-owned actions, outside the listbox, in the same scrollport. */
  actions?: ReactNode
}

/** Keep groups and boundaries only when they separate visible options. */
function visibleItems<T extends string>(
  items: readonly SelectItem<T>[],
  matches: (item: SelectOption<T>) => boolean,
  limit: number
) {
  const result: SelectItem<T>[] = []
  let remaining = limit
  let separator: SelectItem<T> | undefined
  for (const item of items) {
    if ('type' in item && item.type === 'separator') {
      separator = item
      continue
    }
    const take = (option: SelectOption<T>) => matches(option) && remaining-- > 0
    const next =
      'type' in item
        ? { ...item, items: item.items.filter(take) }
        : take(item)
          ? item
          : undefined
    if (!next || ('type' in next && !next.items.length)) continue
    if (separator && result.length) result.push(separator)
    result.push(next)
    separator = undefined
  }
  return result
}

/** Internal searchable branch of Select; Base UI owns navigation and selection. */
export function SelectSearch<T extends string>(
  props: SelectControlProps<T> & { search: SelectSearchOptions<T> }
) {
  const {
    search,
    items,
    value,
    label,
    size = 'lg',
    name,
    id,
    form,
    disabled,
    readOnly,
    required,
    invalid,
    error,
    trigger,
    emptyText = 'No options',
  } = props
  const {
    options,
    reserveStart,
    open,
    setOpen,
    changeValue,
    surface,
    triggerProps,
    displayValue,
  } = useSelectField(props)
  const input = useRef<HTMLInputElement>(null)
  const popup = useRef<HTMLDivElement>(null)
  const [session, setSession] = useState({ open, query: '', expanded: false })
  // Also reset when the consumer closes the popup through its controlled prop.
  if (session.open !== open) setSession({ open, query: '', expanded: false })
  const query = session.open === open ? session.query : ''
  const expanded = session.open === open && session.expanded
  const { contains } = Combobox.useFilter()
  const filtered = search.filter ? search.filter(items, query) : items
  const matches = (item: SelectOption<T>) =>
    Boolean(search.filter) ||
    !query ||
    contains(item.label, query) ||
    (item.keywords?.some(term => contains(term, query)) ?? false)
  const matching = visibleItems(filtered, matches, Infinity)
  const limit = expanded ? Infinity : Math.max(1, search.limit ?? Infinity)
  const visible = visibleItems(matching, () => true, limit)
  const shownOptions = flatten(visible)
  const hasMore = shownOptions.length < flatten(matching).length
  const positioning = useListPanelPositioning()
  const searchLabel = search.label ?? `Search ${label}`
  const option = (item: SelectOption<T>) => (
    <Combobox.Item
      key={item.value}
      value={item.value}
      disabled={item.disabled}
      render={
        <ListRow
          size={size}
          start={item.start}
          end={item.end}
          description={item.description}
          reserveStart={reserveStart}
        />
      }
    >
      {item.label}
    </Combobox.Item>
  )
  return (
    <Field.Root
      invalid={invalid ?? (error ? true : undefined)}
      disabled={disabled}
    >
      <Combobox.Root<T, boolean>
        multiple={props.multiple}
        items={shownOptions.map(item => item.value)}
        filter={null}
        value={value}
        onValueChange={changeValue}
        itemToStringLabel={item =>
          options.find(option => option.value === item)?.label ?? item
        }
        inputValue={query}
        onInputValueChange={(next, details) => {
          // Selection must not replace a search query with the option label.
          if (details.reason !== 'input-change') {
            details.cancel()
            return
          }
          setSession(current => ({ ...current, query: next }))
        }}
        name={name}
        id={id}
        form={form}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        open={open}
        onOpenChange={setOpen}
      >
        {trigger ? (
          <Combobox.Trigger {...triggerProps} />
        ) : (
          <Combobox.Trigger {...triggerProps}>{displayValue}</Combobox.Trigger>
        )}
        <Combobox.Portal>
          <Combobox.Positioner
            {...positioning}
            anchor={trigger ? undefined : surface}
            alignOffset={trigger ? 0 : -panelOutset}
            className="z-popover"
          >
            <Combobox.Popup
              ref={popup}
              aria-label={label}
              initialFocus={search.autoFocus === false ? popup : input}
              onFocus={event => {
                // Base UI redirects popup focus into its input on non-touch opens.
                // Keep the explicit no-autofocus mode on the dialog; Tab enters search.
                if (
                  search.autoFocus === false &&
                  event.target === event.currentTarget
                )
                  event.preventBaseUIHandler()
              }}
              render={
                <ListPanel
                  preserveHeight={Boolean(query)}
                  style={
                    trigger
                      ? undefined
                      : {
                          width: `calc(var(--anchor-width) + ${2 * panelOutset}px)`,
                        }
                  }
                  header={
                    <FieldSurface
                      size={size}
                      start={
                        <FieldAddon kind="icon">
                          <Search aria-hidden className="size-5" />
                        </FieldAddon>
                      }
                    >
                      <Combobox.Input
                        ref={input}
                        aria-label={searchLabel}
                        placeholder={search.placeholder ?? searchLabel}
                        className={fieldControlClass}
                      />
                    </FieldSurface>
                  }
                  empty={
                    !shownOptions.length ? (
                      <p
                        role="status"
                        className="px-4 py-3 text-ui-14 text-ui-secondary"
                      >
                        {emptyText}
                      </p>
                    ) : undefined
                  }
                  actions={
                    <>
                      {hasMore && (
                        <Button
                          variant="ghost"
                          size={size}
                          className="w-full justify-start"
                          onClick={() => {
                            setSession(current => ({
                              ...current,
                              expanded: true,
                            }))
                            input.current?.focus({ preventScroll: true })
                          }}
                        >
                          {search.showMoreLabel ?? 'Show more'}
                        </Button>
                      )}
                      {search.actions}
                    </>
                  }
                />
              }
            >
              <Combobox.List aria-label={label}>
                {visible.map(item => {
                  if (!('type' in item)) return option(item)
                  if (item.type === 'separator')
                    return <ListRowSeparator key={item.id} />
                  return (
                    <Combobox.Group key={item.id}>
                      <Combobox.GroupLabel
                        render={<ListRowHeader size={size} />}
                      >
                        {item.label}
                      </Combobox.GroupLabel>
                      {item.items.map(option)}
                    </Combobox.Group>
                  )
                })}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </Field.Root>
  )
}
