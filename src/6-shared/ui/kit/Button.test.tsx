import '@testing-library/jest-dom/vitest'
import { createRef } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { IconButton } from './Button'

afterEach(cleanup)

it('turning off the tooltip preserves the named, focused button and its action', () => {
  const ref = createRef<HTMLButtonElement>()
  const onClick = vi.fn()
  const view = render(
    <IconButton label="Add item" ref={ref} onClick={onClick}>
      +
    </IconButton>
  )
  const button = screen.getByRole('button', { name: 'Add item' })
  button.focus()
  view.rerender(
    <IconButton label="Add item" tooltip={false} ref={ref} onClick={onClick}>
      +
    </IconButton>
  )
  expect(screen.getByRole('button', { name: 'Add item' })).toBe(button)
  expect(ref.current).toBe(button)
  expect(button).toHaveFocus()
  fireEvent.click(button)
  expect(onClick).toHaveBeenCalledOnce()
})
