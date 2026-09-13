import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { createRef } from 'react'
import { Input } from './Input'
import { Textarea } from './Textarea'
import { Button } from './Button'
import { FieldAddon } from './Field'

afterEach(cleanup)

it.each([Input, Textarea])(
  'connects the label, descriptions and external errors',
  Control => {
    const view = render(
      <Control label="Comment" description="Optional" error="Too long" />
    )
    const input = screen.getByRole('textbox', { name: 'Comment' })
    expect(input).toHaveAccessibleDescription('Optional Too long')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    view.rerender(<Control label="Comment" description="Optional" />)
    expect(input).toHaveAccessibleDescription('Optional')
    expect(input).not.toHaveAttribute('aria-invalid')
  }
)

it('preserves button interaction and native readonly/disabled behavior', () => {
  const action = vi.fn()
  render(
    <>
      <Input
        label="Search"
        end={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Clear"
            onClick={action}
          >
            ×
          </Button>
        }
      />
      <Input label="Readonly" readOnly defaultValue="Copy me" />
      <Input label="Disabled" disabled />
    </>
  )
  const button = screen.getByRole('button', { name: 'Clear' })
  button.focus()
  fireEvent.mouseDown(button)
  fireEvent.click(button)
  expect(action).toHaveBeenCalledOnce()
  expect(button).toHaveFocus()
  expect(screen.getByLabelText('Readonly')).toHaveAttribute('readonly')
  expect(screen.getByLabelText('Disabled')).toBeDisabled()
})

it.each([Input, Textarea])(
  'preserves external IDs, descriptions, edits and refs',
  Control => {
    const ref = createRef<HTMLInputElement & HTMLTextAreaElement>()
    const onChange = vi.fn()
    const props = {
      label: 'Note',
      id: 'note',
      name: 'note',
      ref,
      onChange,
      'aria-describedby': 'external',
    }
    const view = render(
      <>
        <p id="external">External hint</p>
        <Control
          {...props}
          value="First"
          description="Local hint"
          error="Rejected"
        />
      </>
    )
    const control = screen.getByRole('textbox', { name: 'Note' })
    expect(control).toBe(ref.current)
    expect(control).toHaveAttribute('id', 'note')
    expect(control).toHaveAttribute('name', 'note')
    const description = control
      .getAttribute('aria-describedby')!
      .split(' ')
      .map(id => document.getElementById(id)?.textContent)
    expect(description).toEqual(
      expect.arrayContaining(['External hint', 'Local hint', 'Rejected'])
    )
    fireEvent.change(control, { target: { value: 'Edited' } })
    expect(onChange).toHaveBeenCalledOnce()
    view.rerender(
      <>
        <p id="external">External hint</p>
        <Control {...props} value="Updated" description="Local hint" />
      </>
    )
    expect(control).toHaveValue('Updated')
    expect(control).not.toHaveAttribute('aria-invalid')
    expect(control).toHaveAccessibleDescription(
      expect.stringContaining('External hint')
    )
    expect(control).toHaveAccessibleDescription(
      expect.stringContaining('Local hint')
    )
    expect(control).not.toHaveAccessibleDescription(
      expect.stringContaining('Rejected')
    )
    view.unmount()
    expect(ref.current).toBeNull()
  }
)

it.each([Input, Textarea])(
  'focuses the control from its passive addon',
  Control => {
    render(
      <Control
        label="Note"
        start={<FieldAddon kind="icon">Passive icon</FieldAddon>}
      />
    )
    fireEvent.mouseDown(screen.getByText('Passive icon'))
    expect(screen.getByRole('textbox', { name: 'Note' })).toHaveFocus()
  }
)

it.each([Input, Textarea])(
  'preserves custom action addon interaction',
  Control => {
    render(
      <Control
        label="Note"
        end={
          <FieldAddon kind="action">
            <div tabIndex={0}>Custom action</div>
          </FieldAddon>
        }
      />
    )
    const action = screen.getByText('Custom action')
    action.focus()
    expect(fireEvent.mouseDown(action)).toBe(true)
    expect(action).toHaveFocus()
  }
)

it('preserves a floating field placeholder', () => {
  render(<Input label="Amount" labelMode="floating" placeholder="0.00" />)
  expect(screen.getByRole('textbox', { name: 'Amount' })).toHaveAttribute(
    'placeholder',
    '0.00'
  )
})

it.each([Input, Textarea])('separates field and control styling', Control => {
  render(
    <Control
      label="Styled"
      className="field-custom"
      style={{ marginTop: 17 }}
      controlClassName="control-custom"
      controlStyle={{ letterSpacing: 2 }}
    />
  )
  const control = screen.getByRole('textbox', { name: 'Styled' })
  expect(control).toHaveClass('control-custom')
  expect(control).not.toHaveClass('field-custom')
  expect(control).toHaveStyle({ letterSpacing: '2px' })
  expect(control.closest('.field-custom')).toHaveStyle({ marginTop: '17px' })
})
