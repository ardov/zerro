import '@testing-library/jest-dom/vitest'
import { createRef } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { Tooltip } from './Tooltip'
import { Button } from './Button'

afterEach(cleanup)

it('preserves the trigger, value, ref and handlers when content is toggled', () => {
  const ref = createRef<HTMLInputElement>()
  const change = vi.fn()
  const trigger = <input aria-label="Amount" ref={ref} onChange={change} />
  const view = render(<Tooltip content="Exact amount">{trigger}</Tooltip>)
  const input = screen.getByRole('textbox', { name: 'Amount' })
  fireEvent.change(input, { target: { value: '120' } })
  input.focus()
  for (const content of [undefined, '', false, 0, 'New amount']) {
    view.rerender(<Tooltip content={content}>{trigger}</Tooltip>)
    expect(ref.current).toBe(input)
    expect(input).toHaveValue('120')
    expect(input).toHaveFocus()
  }
  view.rerender(
    <Tooltip disabled content="Exact amount">
      {trigger}
    </Tooltip>
  )
  expect(ref.current).toBe(input)
  expect(input).toHaveFocus()
  expect(change).toHaveBeenCalledTimes(1)
})

it('disables only the tooltip and preserves the button name and action', () => {
  const click = vi.fn()
  const ref = createRef<HTMLButtonElement>()
  render(
    <Tooltip disabled content="Additional explanation">
      <Button ref={ref} onClick={click} aria-label="Save">
        Save
      </Button>
    </Tooltip>
  )
  const button = screen.getByRole('button', { name: 'Save' })
  expect(ref.current).toBe(button)
  expect(button).toBeEnabled()
  fireEvent.click(button)
  expect(click).toHaveBeenCalledTimes(1)
})
