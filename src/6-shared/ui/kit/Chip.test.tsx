import '@testing-library/jest-dom/vitest'
import { createRef } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { getContrastRatio } from '@/6-shared/ui/theme/color'
import { Chip } from './Chip'

afterEach(cleanup)

it('keeps editing and removal separate with one tab stop', () => {
  const onClick = vi.fn()
  const onRemove = vi.fn()
  render(
    <Chip onClick={onClick} onRemove={onRemove}>
      Food
    </Chip>
  )
  const [primary, remove] = screen.getAllByRole('button')
  expect(primary).toHaveAccessibleName('Food')
  expect(primary.tabIndex).toBe(0)
  expect(remove.tabIndex).toBe(-1)
  expect(primary).not.toContainElement(remove)
  fireEvent.click(remove)
  expect(onRemove).toHaveBeenCalledTimes(1)
  expect(onClick).not.toHaveBeenCalled()
  fireEvent.click(primary)
  expect(onClick).toHaveBeenCalledTimes(1)
  fireEvent.keyDown(primary, { key: 'Delete' })
  fireEvent.keyDown(primary, { key: 'Delete', repeat: true })
  expect(onRemove).toHaveBeenCalledTimes(2)
})

it('has no button when static and exposes a single removal action otherwise', () => {
  const onRemove = vi.fn()
  const view = render(<Chip>Food</Chip>)
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
  view.rerender(<Chip onRemove={onRemove}>Food</Chip>)
  const button = screen.getByRole('button')
  fireEvent.click(button)
  fireEvent.keyDown(button, { key: 'Backspace' })
  expect(onRemove).toHaveBeenCalledTimes(2)
})

it('blocks both actions when disabled', () => {
  const onClick = vi.fn()
  const onRemove = vi.fn()
  render(
    <Chip disabled onClick={onClick} onRemove={onRemove}>
      Food
    </Chip>
  )
  for (const button of screen.getAllByRole('button')) {
    expect(button).toBeDisabled()
    fireEvent.click(button)
    fireEvent.keyDown(button, { key: 'Delete' })
  }
  expect(onClick).not.toHaveBeenCalled()
  expect(onRemove).not.toHaveBeenCalled()
})

it.each([
  '#fff',
  '#000',
  '#777',
  '#f5dd72',
  'rgb(23, 37, 84)',
  'oklch(0.600 0.150 150)',
])('chooses readable text on %s', color => {
  render(<Chip color={color}>Food</Chip>)
  const chip = screen
    .getByText('Food')
    .closest('[data-slot="chip"]') as HTMLElement
  expect(getContrastRatio(chip.style.color, color)).toBeGreaterThanOrEqual(4.5)
})

it.each(['outline', 'outline-draft'] as const)(
  'ignores fill color for %s',
  variant => {
    render(
      <Chip variant={variant} color="#000">
        Food
      </Chip>
    )
    const chip = screen
      .getByText('Food')
      .closest('[data-slot="chip"]') as HTMLElement
    expect(chip.style.backgroundColor).toBe('')
    expect(chip.style.color).toBe('')
  }
)

it('forwards focus and accessible attributes to the primary action', () => {
  const ref = createRef<HTMLSpanElement>()
  const onKeyDown = vi.fn(event => event.preventDefault())
  const onRemove = vi.fn()
  render(
    <Chip
      ref={ref}
      tabIndex={-1}
      aria-label="Edit food"
      aria-expanded={false}
      onClick={vi.fn()}
      onRemove={onRemove}
      onKeyDown={onKeyDown}
    >
      Food
    </Chip>
  )
  const primary = screen.getByRole('button', { name: 'Edit food' })
  expect(primary.tabIndex).toBe(-1)
  expect(primary).toHaveAttribute('aria-expanded', 'false')
  ref.current?.focus()
  expect(primary).toHaveFocus()
  fireEvent.keyDown(primary, { key: 'Delete' })
  expect(onKeyDown).toHaveBeenCalledTimes(1)
  expect(onRemove).not.toHaveBeenCalled()
})
