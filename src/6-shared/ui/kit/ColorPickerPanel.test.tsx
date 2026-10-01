import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useState } from 'react'
import '@/6-shared/localization'
import {
  ColorPickerPanel,
  type ColorPickerPanelProps,
} from './ColorPickerPanel'

afterEach(cleanup)
const colors = ['#CC3077', '#ffffff']
function Picker(props: Pick<ColorPickerPanelProps, 'value' | 'onChange'>) {
  const [draft, setDraft] = useState(props.value ?? '')
  return (
    <ColorPickerPanel
      {...props}
      colors={colors}
      draft={draft}
      onDraftChange={setDraft}
    />
  )
}

it('confirms the selected color and only removes through the explicit action', () => {
  const onChange = vi.fn()
  render(<Picker value="#cc3077" onChange={onChange} />)
  const selected = screen.getByRole('button', { name: '#CC3077' })
  expect(selected).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(selected)
  expect(onChange).toHaveBeenLastCalledWith('#CC3077')
  fireEvent.click(screen.getByRole('button', { name: 'No color' }))
  expect(onChange).toHaveBeenLastCalledWith(null)
  expect(onChange).toHaveBeenCalledTimes(2)
})

it('silently ignores invalid input and normalizes valid input without submitting a parent form', () => {
  const onChange = vi.fn()
  const onSubmit = vi.fn(event => event.preventDefault())
  render(
    <form onSubmit={onSubmit}>
      <Picker value={null} onChange={onChange} />
    </form>
  )
  const input = screen.getByRole('textbox', { name: 'HEX color' })
  fireEvent.change(input, { target: { value: 'rgb(' } })
  expect(input).not.toHaveAttribute('aria-invalid', 'true')
  fireEvent.keyDown(input, { key: 'Enter' })
  expect(onChange).not.toHaveBeenCalled()
  fireEvent.change(input, { target: { value: '#AbC123' } })
  fireEvent.keyDown(input, { key: 'Enter', isComposing: true })
  expect(onChange).not.toHaveBeenCalled()
  fireEvent.keyDown(input, { key: 'Enter' })
  expect(onChange).toHaveBeenCalledExactlyOnceWith('#abc123')
  expect(onSubmit).not.toHaveBeenCalled()
})

it('selects the whole input on focus and applies through its addon without submitting', () => {
  const onChange = vi.fn()
  const onSubmit = vi.fn(event => event.preventDefault())
  render(
    <form onSubmit={onSubmit}>
      <Picker value="#CC3077" onChange={onChange} />
    </form>
  )
  const input = screen.getByRole('textbox') as HTMLInputElement
  fireEvent.focus(input)
  expect(input.selectionStart).toBe(0)
  expect(input.selectionEnd).toBe(input.value.length)
  fireEvent.change(input, { target: { value: '32' } })
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }))
  expect(onChange).toHaveBeenCalledExactlyOnceWith('#323232')
  expect(onSubmit).not.toHaveBeenCalled()
})
