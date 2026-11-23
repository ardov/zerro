import type { ReactNode } from 'react'
import {
  SelectControl,
  type SelectOption,
  type SelectProps,
  type SelectRequirement,
} from './Select'

export type MultiSelectProps<T extends string = string> = Omit<
  SelectProps<T>,
  | 'value'
  | 'onChange'
  | 'renderValue'
  | 'alignSelected'
  | 'required'
  | 'clearable'
> &
  SelectRequirement & {
    value: T[]
    onChange: (value: T[]) => void
    selectionLabel?: (count: number) => string
    renderValue?: (items: readonly SelectOption<T>[]) => ReactNode
  }

export function MultiSelect<T extends string>(props: MultiSelectProps<T>) {
  return <SelectControl<T> {...props} multiple />
}
