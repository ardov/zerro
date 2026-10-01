import { cleanup, renderHook } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { afterEach, expect, expectTypeOf, it, vi } from 'vitest'
import { OverlayHost } from '@/6-shared/overlays'
import type { SelectProps, SelectRequirement } from './Select'
import { useSelectField } from './useSelectField'

afterEach(cleanup)
const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>
    <OverlayHost>{children}</OverlayHost>
  </MemoryRouter>
)
const items = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
] as const

it('infers non-null required answers and nullable optional answers', () => {
  const required = {
    label: 'Choice',
    items,
    value: null,
    required: true,
    onChange: value => {
      expectTypeOf(value).toEqualTypeOf<'a' | 'b'>()
    },
  } satisfies SelectProps<'a' | 'b'>
  const optional = {
    label: 'Choice',
    items,
    value: null,
    onChange: value => {
      expectTypeOf(value).toEqualTypeOf<'a' | 'b' | null>()
    },
  } satisfies SelectProps<'a' | 'b'>
  required.onChange('a')
  optional.onChange(null)
})

it('ignores clearing a required selection, including an initially empty one', () => {
  const onChange = vi.fn()
  const { result } = renderHook(
    () =>
      useSelectField({
        label: 'Choice',
        items,
        value: null,
        required: true,
        onChange,
      }),
    { wrapper }
  )
  result.current.changeValue(null)
  expect(onChange).not.toHaveBeenCalled()
  result.current.changeValue('a')
  expect(onChange).toHaveBeenCalledExactlyOnceWith('a')
})

it('reports null when an optional selection is cleared', () => {
  const onChange = vi.fn()
  const { result } = renderHook(
    () => useSelectField({ label: 'Choice', items, value: 'a', onChange }),
    { wrapper }
  )
  result.current.changeValue(null)
  expect(onChange).toHaveBeenCalledExactlyOnceWith(null)
})

it('infers non-null answers for an optional non-clearable field', () => {
  const props = {
    label: 'Choice',
    items,
    value: null,
    clearable: false,
    onChange: value => {
      expectTypeOf(value).toEqualTypeOf<'a' | 'b'>()
    },
  } satisfies SelectProps<'a' | 'b'>
  props.onChange('a')
  expectTypeOf<{
    required: true
    clearable: true
  }>().not.toExtend<SelectRequirement>()
})

it('ignores clearing and repeated selection without making the field required', () => {
  const onChange = vi.fn()
  const { result } = renderHook(
    () =>
      useSelectField({
        label: 'Choice',
        items,
        value: 'a',
        clearable: false,
        onChange,
      }),
    { wrapper }
  )
  result.current.changeValue(null)
  result.current.changeValue('a')
  expect(onChange).not.toHaveBeenCalled()
  result.current.changeValue('b')
  expect(onChange).toHaveBeenCalledExactlyOnceWith('b')
})

it('ignores repeated optional values, including an already empty field', () => {
  const onChange = vi.fn()
  const { result } = renderHook(
    () =>
      useSelectField({
        label: 'Choice',
        items,
        value: null,
        onChange,
      }),
    { wrapper }
  )
  result.current.changeValue(null)
  expect(onChange).not.toHaveBeenCalled()
})

it('compares multiple values by contents and preserves meaningful order changes', () => {
  const onChange = vi.fn()
  const { result } = renderHook(
    () =>
      useSelectField({
        label: 'Choice',
        items,
        value: ['a', 'b'],
        multiple: true,
        clearable: false,
        onChange,
      }),
    { wrapper }
  )
  result.current.changeValue(['a', 'b'])
  result.current.changeValue([])
  expect(onChange).not.toHaveBeenCalled()
  result.current.changeValue(['b', 'a'])
  expect(onChange).toHaveBeenCalledExactlyOnceWith(['b', 'a'])
})
