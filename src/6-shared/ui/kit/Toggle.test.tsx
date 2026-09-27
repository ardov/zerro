import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Checkbox, CheckboxField } from './Checkbox'
import { Switch, SwitchField } from './Switch'

afterEach(cleanup)

describe.each([
  { Control: Checkbox, Field: CheckboxField, role: 'checkbox' },
  { Control: Switch, Field: SwitchField, role: 'switch' },
])('$role', ({ Control, Field, role }) => {
  it('supports uncontrolled changes and takes defaultChecked only on mount', () => {
    const onCheckedChange = vi.fn()
    const view = render(
      <Control
        aria-label="Setting"
        defaultChecked
        onCheckedChange={onCheckedChange}
      />
    )
    const control = screen.getByRole(role, { name: 'Setting' })
    expect(control).toBeChecked()
    fireEvent.click(control)
    expect(control).not.toBeChecked()
    expect(onCheckedChange).toHaveBeenCalledExactlyOnceWith(
      false,
      expect.any(Object)
    )
    view.rerender(<Control aria-label="Setting" defaultChecked={false} />)
    fireEvent.click(control)
    view.rerender(<Control aria-label="Setting" defaultChecked={false} />)
    expect(control).toBeChecked()
  })

  it('leaves the current controlled value to its owner', () => {
    const onCheckedChange = vi.fn()
    const view = render(
      <Control
        aria-label="Setting"
        checked={false}
        onCheckedChange={onCheckedChange}
      />
    )
    const control = screen.getByRole(role)
    fireEvent.click(control)
    expect(onCheckedChange).toHaveBeenCalledExactlyOnceWith(
      true,
      expect.any(Object)
    )
    expect(control).not.toBeChecked()
    view.rerender(
      <Control aria-label="Setting" checked onCheckedChange={onCheckedChange} />
    )
    expect(control).toBeChecked()
  })

  it('honors cancellation without changing the submitted value', () => {
    const view = render(
      <form>
        <Control
          aria-label="Setting"
          name="setting"
          value="yes"
          onCheckedChange={(_, details) => details.cancel()}
        />
      </form>
    )
    const control = screen.getByRole(role)
    fireEvent.click(control)
    expect(control).not.toBeChecked()
    expect(
      new FormData(view.container.querySelector('form')!).has('setting')
    ).toBe(false)
  })

  it.each(['disabled', 'readOnly'] as const)(
    'prevents changes when %s',
    mode => {
      const onCheckedChange = vi.fn()
      render(
        <Control
          aria-label="Setting"
          defaultChecked
          {...{ [mode]: true }}
          onCheckedChange={onCheckedChange}
        />
      )
      const control = screen.getByRole(role)
      fireEvent.click(control)
      expect(control).toBeChecked()
      expect(onCheckedChange).not.toHaveBeenCalled()
    }
  )

  it('preserves refs, labeling and external descriptions', () => {
    const ref = createRef<HTMLElement>()
    const inputRef = createRef<HTMLInputElement>()
    const view = render(
      <>
        <p id="external">External hint</p>
        <Field
          label="Setting"
          id="setting"
          name="setting"
          ref={ref}
          inputRef={inputRef}
          aria-describedby="external"
        />
      </>
    )
    const control = screen.getByRole(role, { name: 'Setting' })
    expect(ref.current).toBe(control)
    expect(inputRef.current).toHaveAttribute('name', 'setting')
    expect(inputRef.current).toHaveAttribute('id', 'setting')
    expect(control).toHaveAccessibleDescription('External hint')
    view.unmount()
    expect(ref.current).toBeNull()
    expect(inputRef.current).toBeNull()
  })
})

it('exposes mixed selection separately from the checkbox boolean', () => {
  const onCheckedChange = vi.fn()
  const view = render(
    <Checkbox
      aria-label="All accounts"
      checked={false}
      indeterminate
      onCheckedChange={onCheckedChange}
    />
  )
  const control = screen.getByRole('checkbox', { name: 'All accounts' })
  expect(control).toBePartiallyChecked()
  fireEvent.click(control)
  expect(onCheckedChange).toHaveBeenCalledExactlyOnceWith(
    true,
    expect.any(Object)
  )
  view.rerender(
    <Checkbox aria-label="All accounts" checked indeterminate={false} />
  )
  expect(control).toBeChecked()
})
