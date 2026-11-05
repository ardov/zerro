import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { Input } from './Input'
import { InlineField } from './InlineField'
import { Textarea } from './Textarea'

afterEach(cleanup)

it.each([Input, InlineField, Textarea])(
  '%s reports text and clearing alongside native changes',
  async Component => {
    const user = userEvent.setup()
    const native = vi.fn()
    const changed = vi.fn()
    function Editor() {
      const [value, setValue] = useState('')
      return (
        <Component
          label="Text"
          value={value}
          onChange={event => native(event.currentTarget.value)}
          onValueChange={next => {
            changed(next)
            setValue(next)
          }}
        />
      )
    }
    render(<Editor />)
    const input = screen.getByRole('textbox', { name: 'Text' })
    await user.type(input, 'ab')
    await user.clear(input)
    expect(native.mock.calls).toEqual([['a'], ['ab'], ['']])
    expect(changed.mock.calls).toEqual(native.mock.calls)
  }
)
