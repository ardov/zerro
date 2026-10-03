import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  AmountInput,
  AmountInlineField,
  type AmountInputProps,
} from './AmountInput'
import { FieldAddon } from './Field'

afterEach(cleanup)

function CurrencyAddon() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Currency
      </button>
      {open &&
        createPortal(
          <button type="button" autoFocus>
            Choose EUR
          </button>,
          document.body
        )}
    </>
  )
}

describe.each([AmountInput, AmountInlineField])('%s', Control => {
  function Editor(props: Partial<AmountInputProps>) {
    const [value, setValue] = useState(props.value ?? 1250)
    return (
      <>
        <Control label="Amount" {...props} value={value} onChange={setValue} />
        <output data-testid="amount">{value}</output>
        <button type="button" onClick={() => setValue(8000)}>
          Reset amount
        </button>
      </>
    )
  }

  it('formats arithmetic live and settles it on Enter without requiring a submit handler', async () => {
    const user = userEvent.setup()
    render(<Editor />)
    const input = screen.getByRole('textbox', { name: 'Amount' })
    await user.clear(input)
    await user.type(input, '12000+3000÷2')
    expect(input).toHaveValue('12\u00a0000+3\u00a0000/2')
    expect(screen.getByTestId('amount')).toHaveTextContent(/^13500$/)
    await user.keyboard('{Enter}')
    expect(input).toHaveValue('13\u00a0500')
    expect(input).toHaveFocus()
  })

  it('hides zero fractions after editing without losing fractional amounts', async () => {
    const user = userEvent.setup()
    render(<Editor value={0} />)
    const input = screen.getByRole('textbox', { name: 'Amount' })
    expect(input).toHaveValue('0')
    await user.clear(input)
    await user.type(input, '12,00')
    expect(input).toHaveValue('12,00')
    await user.tab()
    expect(input).toHaveValue('12')
    await user.clear(input)
    await user.type(input, '12,50{Enter}')
    expect(input).toHaveValue('12,50')
    expect(screen.getByTestId('amount')).toHaveTextContent(/^12.5$/)
  })

  it('reverts invalid arithmetic to the last valid result on Enter or blur', async () => {
    const user = userEvent.setup()
    const onEnter = vi.fn()
    render(<Editor onEnter={onEnter} />)
    const input = screen.getByRole('textbox', { name: 'Amount' })
    await user.clear(input)
    await user.type(input, '12/0')
    expect(screen.getByTestId('amount')).toHaveTextContent(/^12$/)
    await user.keyboard('{Enter}')
    expect(onEnter).toHaveBeenLastCalledWith(12)
    expect(input).toHaveValue('12')
    await user.keyboard('{End}/0')
    await user.tab()
    expect(input).toHaveValue('12')
    expect(input).not.toHaveAttribute('aria-invalid')
  })

  it('keeps the expression across addons and inserts an operator at the selection', async () => {
    const user = userEvent.setup()
    const action = vi.fn()
    render(
      <Editor
        value={0}
        operators
        selectOnFocus
        end={
          <FieldAddon kind="action">
            <button type="button" onClick={action}>
              Currency
            </button>
          </FieldAddon>
        }
      />
    )
    const input = screen.getByRole<HTMLInputElement>('textbox', {
      name: 'Amount',
    })
    await user.click(input)
    await user.type(input, '12000+3000')
    await user.click(screen.getByRole('button', { name: 'Currency' }))
    expect(action).toHaveBeenCalledOnce()
    expect(input).toHaveValue('12\u00a0000+3\u00a0000')
    await user.click(input)
    input.setSelectionRange(6, 7)
    await user.click(screen.getByRole('button', { name: '×' }))
    expect(input).toHaveFocus()
    expect(input).toHaveValue('12\u00a0000*3\u00a0000')
    expect(input.selectionStart).toBe(7)
    expect(screen.getByTestId('amount')).toHaveTextContent(/^36000000$/)
  })

  it('retains the selection when reaching operator buttons by keyboard', async () => {
    const user = userEvent.setup()
    render(<Editor value={1234} operators />)
    const input = screen.getByRole<HTMLInputElement>('textbox', {
      name: 'Amount',
    })
    await user.click(input)
    input.setSelectionRange(3, 3)
    fireEvent.select(input)
    await user.tab()
    expect(screen.getByRole('button', { name: '+' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(input.value.startsWith('12+34')).toBe(true)
    expect(input).toHaveFocus()
    expect(input.selectionStart).toBe(3)
  })

  it('keeps the expression while an addon popup owns focus', async () => {
    const user = userEvent.setup()
    render(
      <Editor
        value={0}
        end={
          <FieldAddon kind="action">
            <CurrencyAddon />
          </FieldAddon>
        }
      />
    )
    const input = screen.getByRole('textbox', { name: 'Amount' })
    await user.click(input)
    await user.type(input, '12000/3')
    await user.click(screen.getByRole('button', { name: 'Currency' }))
    expect(screen.getByRole('button', { name: 'Choose EUR' })).toHaveFocus()
    expect(input).toHaveValue('12\u00a0000/3')
    await user.click(screen.getByRole('button', { name: 'Reset amount' }))
    expect(input).toHaveValue('8\u00a0000')
  })

  it('accepts an external value while focused without replacing its own expression echoes', () => {
    const onChange = vi.fn()
    const view = render(
      <Control label="Amount" value={12} onChange={onChange} />
    )
    const input = screen.getByRole('textbox', { name: 'Amount' })
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: '12+3' } })
    expect(onChange).toHaveBeenLastCalledWith(15)
    view.rerender(<Control label="Amount" value={15} onChange={onChange} />)
    expect(input).toHaveValue('12+3')
    view.rerender(<Control label="Amount" value={8000} onChange={onChange} />)
    expect(input).toHaveValue('8\u00a0000')
  })

  it('preserves accessible labels, external errors and the input ref', () => {
    const ref = createRef<HTMLInputElement>()
    const view = render(
      <Control
        label="Amount"
        value={50}
        onChange={() => {}}
        ref={ref}
        {...(Control === AmountInput
          ? { description: 'In CZK', error: 'Amount must be positive' }
          : { invalid: true, 'aria-label': 'Amount' })}
      />
    )
    const input = screen.getByRole('textbox', { name: 'Amount' })
    expect(input).toBe(ref.current)
    if (Control === AmountInput) {
      expect(input).toHaveAccessibleDescription(
        'In CZK Amount must be positive'
      )
    } else {
      expect(input).not.toHaveAttribute('aria-describedby')
    }
    expect(input).toHaveAttribute('aria-invalid', 'true')
    view.unmount()
    expect(ref.current).toBeNull()
  })

  it('undoes and redoes formatted edits and operator buttons', async () => {
    const user = userEvent.setup()
    render(<Editor value={0} operators />)
    const input = screen.getByRole<HTMLInputElement>('textbox', {
      name: 'Amount',
    })
    await user.click(input)
    await user.type(input, '12345')
    await user.keyboard('{Control>}z{/Control}')
    expect(input).toHaveValue('1\u00a0234')
    expect(screen.getByTestId('amount')).toHaveTextContent(/^1234$/)
    await user.keyboard('{Control>}{Shift>}z{/Shift}{/Control}')
    expect(input).toHaveValue('12\u00a0345')
    input.setSelectionRange(2, 2)
    await user.click(screen.getByRole('button', { name: '+' }))
    expect(input).toHaveValue('12+345')
    await user.keyboard('{Meta>}z{/Meta}')
    expect(input).toHaveValue('12\u00a0345')
    expect(screen.getByTestId('amount')).toHaveTextContent(/^12345$/)
  })

  it.each(['disabled', 'readOnly'] as const)(
    'makes operator buttons unavailable when %s',
    state => {
      const onChange = vi.fn()
      render(
        <Control
          label="Amount"
          value={12}
          onChange={onChange}
          operators
          {...{ [state]: true }}
        />
      )
      expect(screen.getByRole('button', { name: '+' })).toBeDisabled()
      expect(screen.getByRole('textbox')).toHaveAttribute(
        state === 'disabled' ? 'disabled' : 'readonly'
      )
      expect(onChange).not.toHaveBeenCalled()
    }
  )
})
