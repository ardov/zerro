import type { ReactNode } from 'react'
import { SelectControl, type SelectOption, type SelectProps } from './Select'

export type MultiSelectProps<T extends string = string> = Omit<
  SelectProps<T>,
  'value' | 'onChange' | 'renderValue' | 'alignSelected'
> & {
  value: T[]
  onChange: (value: T[]) => void
  /** Localized summary when more than one value is selected. */
  selectionLabel?: (count: number) => string
  /** Receives available selected options in value order. */
  renderValue?: (items: readonly SelectOption<T>[]) => ReactNode
}

/** Immediate multiple selection; closing the panel keeps all changes. */
export function MultiSelect<T extends string>(props: MultiSelectProps<T>) {
  return <SelectControl<T> {...props} multiple />
}
