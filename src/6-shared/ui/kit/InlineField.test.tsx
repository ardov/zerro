import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, useState } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { InlineField } from './InlineField'

afterEach(cleanup)

it('edits text and leaves Enter and Escape decisions to the caller', async () => {
  const user = userEvent.setup()
  const keys = vi.fn()
  function Editor() {
    const [value, setValue] = useState('Food')
    return (
      <InlineField
        label="Category"
        value={value}
        onChange={event => setValue(event.target.value)}
        onKeyDown={keys}
      />
    )
  }
  render(<Editor />)
  const input = screen.getByRole('textbox', { name: 'Category' })
  await user.clear(input)
  await user.type(input, 'Travel{Enter}{Escape}')
  expect(input).toHaveValue('Travel')
  expect(input).toHaveFocus()
  expect(keys.mock.calls.map(([event]) => event.key)).toEqual(
    expect.arrayContaining(['Enter', 'Escape'])
  )
})

it('exposes the input ref and external accessibility feedback without rendering a message', () => {
  const ref = createRef<HTMLInputElement>()
  render(
    <>
      <InlineField
        ref={ref}
        label="Category"
        value=""
        invalid
        aria-describedby="reason"
        readOnly
      />
      <span id="reason">Choose a name</span>
    </>
  )
  const input = screen.getByRole('textbox', { name: 'Category' })
  expect(ref.current).toBe(input)
  expect(input).toHaveAttribute('aria-invalid', 'true')
  expect(input).toHaveAccessibleDescription('Choose a name')
})

it.each(['readOnly', 'disabled'] as const)(
  'prevents editing when %s',
  async state => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <InlineField
        label="Category"
        value="Food"
        onChange={onChange}
        {...{ [state]: true }}
      />
    )
    await user.type(screen.getByRole('textbox'), 'x')
    expect(onChange).not.toHaveBeenCalled()
  }
)

it('focuses from passive addons and preserves action addon interaction', async () => {
  const user = userEvent.setup()
  const action = vi.fn()
  render(
    <InlineField
      label="Amount"
      value="123"
      readOnly
      start={<span>CZK</span>}
      end={<button onClick={action}>Currency</button>}
    />
  )
  await user.click(screen.getByText('CZK'))
  expect(screen.getByRole('textbox')).toHaveFocus()
  await user.click(screen.getByRole('button', { name: 'Currency' }))
  expect(action).toHaveBeenCalledOnce()
  expect(screen.getByRole('button')).toHaveFocus()
})
