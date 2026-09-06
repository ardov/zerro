import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { BigAmountInput } from './BigAmountInput'

const meta = {
  title: 'Library/Inputs/BigAmountInput',
  component: BigAmountInput,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    value: 3243700,
    currency: 'CZK',
    sign: '−',
    'aria-label': 'Amount',
    onChange: () => {},
  },
} satisfies Meta<typeof BigAmountInput>
export default meta
type Story = StoryObj<typeof meta>

/** One component instance, entirely controlled by the Args panel. */
export const Bench: Story = {
  render: function Render(args) {
    const [value, setValue] = useState(args.value)
    return <BigAmountInput {...args} value={value} onChange={setValue} />
  },
}

/** The signs an amount is shown with, and what nothing looks like. */
function VariantShowcase() {
  return (
    <div className="flex w-[320px] flex-col gap-6">
      <BigAmountInput
        value={3243700}
        currency="CZK"
        sign="−"
        aria-label="Expense"
        onChange={() => {}}
      />
      <BigAmountInput
        value={3243700}
        currency="CZK"
        sign="+"
        aria-label="Income"
        onChange={() => {}}
      />
      <BigAmountInput
        value={12.5}
        currency="EUR"
        sign="−"
        aria-label="Fraction"
        onChange={() => {}}
      />
      <BigAmountInput
        value={0}
        currency="RUB"
        sign="−"
        aria-label="Empty"
        onChange={() => {}}
      />
      <BigAmountInput
        value={99}
        currency="RUB"
        sign="−"
        disabled
        aria-label="Disabled"
        onChange={() => {}}
      />
    </div>
  )
}

export const Showcase: Story = {
  tags: ['!test'],
  render: () => <VariantShowcase />,
}

/** The arithmetic stays on screen while it is typed, and the amount it is
 * worth is reported on every keystroke. */
export const ExpressionCheck: Story = {
  tags: ['!autodocs'],
  render: function Render(args) {
    const [value, setValue] = useState(0)
    return (
      <>
        <BigAmountInput {...args} value={value} onChange={setValue} />
        <output data-testid="value">{value}</output>
      </>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole('textbox', { name: 'Amount' })
    await userEvent.click(input)
    await userEvent.type(input, '25,5+4.5')
    await expect(input).toHaveValue('25.5+4.5')
    await expect(canvas.getByTestId('value')).toHaveTextContent(/^30$/)
    await userEvent.tab()
    await expect(input).toHaveValue('30')
  },
}
