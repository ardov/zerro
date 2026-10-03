import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { createRef } from 'react'
import { Input } from './Input'
import { Textarea } from './Textarea'
import { IconButton } from './Button'
import { FieldAddon, FieldSurface } from './Field'

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
          <IconButton variant="ghost" size="sm" label="Clear" onClick={action}>
            ×
          </IconButton>
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

it('focuses a composed control from the surface and passive icon, ignoring outer focus markers', () => {
  const ref = createRef<HTMLInputElement>()
  render(
    <div tabIndex={-1} data-field-focus="preserve">
      <FieldSurface
        controlRef={ref}
        data-testid="surface"
        start={
          <FieldAddon kind="icon">
            <svg aria-label="Direction">
              <path />
            </svg>
          </FieldAddon>
        }
      >
        <input ref={ref} aria-label="Amount" />
      </FieldSurface>
    </div>
  )
  const input = screen.getByRole('textbox')
  fireEvent.mouseDown(screen.getByTestId('surface'))
  expect(input).toHaveFocus()
  input.blur()
  fireEvent.mouseDown(screen.getByLabelText('Direction').querySelector('path')!)
  expect(input).toHaveFocus()
  expect(fireEvent.mouseDown(input)).toBe(true)
})

it.each(['disabled', 'cancelled', 'no-ref'])(
  'does not redirect focus when %s',
  mode => {
    const ref = createRef<HTMLInputElement>()
    render(
      <FieldSurface
        data-testid="surface"
        controlRef={mode === 'no-ref' ? undefined : ref}
        disabled={mode === 'disabled'}
        onMouseDown={event => {
          if (mode === 'cancelled') event.preventDefault()
        }}
      >
        <input ref={ref} aria-label="Amount" />
      </FieldSurface>
    )
    fireEvent.mouseDown(screen.getByTestId('surface'))
    expect(screen.getByRole('textbox')).not.toHaveFocus()
  }
)

it.each([Input, Textarea])(
  'focuses a floating control from its label area',
  Control => {
    render(
      <Control label="Amount label" labelMode="floating" defaultValue="125" />
    )
    const control = screen.getByRole('textbox', { name: 'Amount label' })
    const label = screen.getByText('Amount label', { selector: 'label' })
    // The visual label ignores pointer events; its content container receives
    // the hit. It must not be treated as an interactive addon.
    fireEvent.mouseDown(label.parentElement!)
    expect(control).toHaveFocus()
    control.blur()
    fireEvent.mouseDown(label)
    expect(control).toHaveFocus()
  }
)
