import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { formatMoney } from '@/6-shared/helpers/money'
import { useAmountExpression } from './useAmountExpression'

function AmountEditor(props: { initial: number; decimals?: 0 | 2 | 'ifAny' }) {
  const [value, setValue] = useState(props.initial)
  const { inputProps } = useAmountExpression({
    value,
    onChange: setValue,
    format: amount => formatMoney(amount, null, props.decimals ?? 2),
    selectOnFocus: false,
  })
  return (
    <>
      <input {...inputProps} aria-label="Amount" />
      <output>{value}</output>
    </>
  )
}

describe('useAmountExpression', () => {
  it('keeps the resting formatting when the field gains focus', async () => {
    const user = userEvent.setup()
    render(<AmountEditor initial={1250} />)
    const input = screen.getByRole<HTMLInputElement>('textbox', {
      name: 'Amount',
    })

    expect(input.value).toBe('1\u00a0250,00')
    await user.click(input)
    expect(input.value).toBe('1\u00a0250,00')
  })

  it('keeps zero empty while it is being replaced', async () => {
    const user = userEvent.setup()
    render(<AmountEditor initial={0} />)
    const input = screen.getByRole<HTMLInputElement>('textbox', {
      name: 'Amount',
    })

    expect(input.value).toBe('0,00')
    await user.click(input)
    expect(input.value).toBe('')
    await user.type(input, '25')
    expect(input.value).toBe('25')
  })

  it('formats every operand while preserving the expression being typed', async () => {
    const user = userEvent.setup()
    render(<AmountEditor initial={0} />)
    const input = screen.getByRole<HTMLInputElement>('textbox', {
      name: 'Amount',
    })

    await user.click(input)
    await user.clear(input)
    await user.type(input, '12000/3+2500,5')

    expect(input.value).toBe('12\u00a0000/3+2\u00a0500,5')
    expect(screen.getByText('6500.5')).toBeTruthy()
    expect(input.selectionStart).toBe(input.value.length)
  })

  it('keeps the caret with the inserted digit when grouping changes', async () => {
    const user = userEvent.setup()
    render(<AmountEditor initial={999} decimals="ifAny" />)
    const input = screen.getByRole<HTMLInputElement>('textbox', {
      name: 'Amount',
    })

    await user.click(input)
    input.setSelectionRange(3, 3)
    await user.type(input, '0')

    expect(input.value).toBe('9\u00a0990')
    expect(input.selectionStart).toBe(5)
    expect(input.selectionEnd).toBe(5)
  })

  it('keeps the caret in place when an unsupported character is discarded', async () => {
    const user = userEvent.setup()
    render(<AmountEditor initial={12345} decimals="ifAny" />)
    const input = screen.getByRole<HTMLInputElement>('textbox', {
      name: 'Amount',
    })

    await user.click(input)
    input.setSelectionRange(4, 4)
    await user.type(input, 'x', { skipClick: true })

    expect(input.value).toBe('12\u00a0345')
    expect(input.selectionStart).toBe(4)
    expect(input.selectionEnd).toBe(4)
  })

  it('deletes the preceding digit instead of a generated separator', async () => {
    const user = userEvent.setup()
    render(<AmountEditor initial={1234} decimals="ifAny" />)
    const input = screen.getByRole<HTMLInputElement>('textbox', {
      name: 'Amount',
    })

    await user.click(input)
    input.setSelectionRange(2, 2)
    await user.keyboard('{Backspace}')

    expect(input.value).toBe('234')
    expect(input.selectionStart).toBe(0)
    expect(screen.getByText('234')).toBeTruthy()
  })

  it('deletes the following digit through a generated separator', async () => {
    const user = userEvent.setup()
    render(<AmountEditor initial={1234} decimals="ifAny" />)
    const input = screen.getByRole<HTMLInputElement>('textbox', {
      name: 'Amount',
    })

    await user.click(input)
    input.setSelectionRange(1, 1)
    await user.keyboard('{Delete}')

    expect(input.value).toBe('134')
    expect(input.selectionStart).toBe(1)
    expect(screen.getByText('134')).toBeTruthy()
  })
})
