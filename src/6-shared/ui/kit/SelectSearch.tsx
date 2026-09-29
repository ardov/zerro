import { useMemo, useRef, useState, type ReactNode } from 'react'
import { Combobox } from '@base-ui/react/combobox'
import { Field } from '@base-ui/react/field'
import { ChevronDown, Search } from 'lucide-react'
import type { SelectItem, SelectOption, SelectControlProps } from './Select'
import {
  useSelectField,
  flattenSelectItems as flatten,
  selectPanelOutset as panelOutset,
} from './useSelectField'
import { FieldAddon, FieldSurface, fieldControlClass } from './Field'
import { ListPanel } from './ListPanel'
import { ListRow, ListRowHeader, ListRowSeparator } from './ListRow'
import { useListPanelPositioning } from './useListPanelPositioning'

export type SelectSearchOptions<T extends string> = {
  label?: string
  placeholder?: string
  autoFocus?: boolean
  /** Query restored on each opening; changes while open do not replace typing. */
  initialQuery?: string
  /** Highlight matches while typing; Enter also accepts a sole initial result. */
  autoHighlight?: boolean
  /** Receives the full source. Return a filtered/ranked result; no second filter runs. */
  filter?: (
    items: readonly SelectItem<T>[],
    query: string,
    context: { expanded: boolean }
  ) => { items: readonly SelectItem<T>[]; hasMore?: boolean }
  showMoreLabel?: string
  /** Consumer-owned actions, outside the listbox, in the same scrollport. */
  actions?: ReactNode
}

/** Keep groups and boundaries only when they separate visible options. */
function visibleItems<T extends string>(
  items: readonly SelectItem<T>[],
  matches: (item: SelectOption<T>) => boolean
) {
  const result: SelectItem<T>[] = []
  let separator: SelectItem<T> | undefined
  for (const item of items) {
    if ('type' in item && item.type === 'separator') {
      separator = item
      continue
    }
    const next =
      'type' in item
        ? { ...item, items: item.items.filter(matches) }
        : matches(item)
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
    name,
    id,
    form,
    disabled,
    readOnly,
    required,
    trigger,
  } = props
  const {
    size,
    options,
    reserveStart,
    open,
    setOpen,
    changeValue,
    surface,
    fieldProps,
    triggerProps,
    displayValue,
    optionRow,
    emptyNotice,
    popupStyle,
  } = useSelectField(props)
  const input = useRef<HTMLInputElement>(null)
  const popup = useRef<HTMLDivElement>(null)
  const [session, setSession] = useState({
    open,
    query: search.initialQuery ?? '',
    expanded: false,
  })
  // Also reset when the consumer closes the popup through its controlled prop.
  if (session.open !== open)
    setSession({
      open,
      query: open ? (search.initialQuery ?? '') : '',
      expanded: false,
    })
  const { query, expanded } = session
  const labels = useMemo(
    () => new Map(options.map(option => [option.value, option.label])),
    [options]
  )
  const { contains } = Combobox.useFilter()
  const filtered = search.filter?.(items, query, { expanded })
  const matches = (item: SelectOption<T>) =>
    Boolean(search.filter) ||
    !query ||
    contains(item.label, query) ||
    (item.keywords?.some(term => contains(term, query)) ?? false)
  const visible = visibleItems(filtered?.items ?? items, matches)
  const shownOptions = flatten(visible)
  const hasMore = !expanded && Boolean(filtered?.hasMore)
  const positioning = useListPanelPositioning()
  const searchLabel = search.label ?? `Search ${label}`
  const option = (item: SelectOption<T>) => (
    <Combobox.Item
      key={item.value}
      value={item.value}
      disabled={item.disabled}
      render={optionRow(item)}
    >
      {item.label}
    </Combobox.Item>
  )
  return (
    <Field.Root {...fieldProps}>
      <Combobox.Root<T, boolean>
        multiple={props.multiple}
        autoHighlight={search.autoHighlight}
        items={shownOptions.map(item => item.value)}
        filter={null}
        value={value}
        onValueChange={changeValue}
        itemToStringLabel={item =>
          shownOptions.find(option => option.value === item)?.label ??
          labels.get(item) ??
          item
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
            alignOffset={-panelOutset}
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
                  style={popupStyle}
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
                        onKeyDown={event => {
                          // Base UI highlights while typing, not for a query
                          // supplied on opening. Enter can still take its sole match.
                          if (
                            search.autoHighlight &&
                            !props.multiple &&
                            event.key === 'Enter' &&
                            !event.nativeEvent.isComposing &&
                            event.keyCode !== 229 &&
                            !event.defaultPrevented &&
                            !event.currentTarget.getAttribute(
                              'aria-activedescendant'
                            ) &&
                            shownOptions.length === 1 &&
                            !shownOptions[0].disabled
                          ) {
                            event.preventDefault()
                            event.preventBaseUIHandler()
                            changeValue(shownOptions[0].value)
                            setOpen(false)
                          }
                        }}
                        aria-label={searchLabel}
                        placeholder={search.placeholder ?? searchLabel}
                        className={fieldControlClass}
                      />
                    </FieldSurface>
                  }
                  empty={emptyNotice(shownOptions.length)}
                  actions={
                    <>
                      {hasMore && (
                        <ListRow
                          render={<button type="button" />}
                          size={size}
                          start={<ChevronDown aria-hidden className="size-5" />}
                          reserveStart={reserveStart}
                          className="hover:after:opacity-100 focus-visible:after:opacity-100"
                          onClick={() => {
                            setSession(current => ({
                              ...current,
                              expanded: true,
                            }))
                            input.current?.focus({ preventScroll: true })
                          }}
                        >
                          {search.showMoreLabel ?? 'Show more'}
                        </ListRow>
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
