import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { IconButton } from './Button'
import { ArrowForwardIcon } from './Icons'
import { AmountInput } from './AmountInput'

const meta = {
  title: 'UI/AmountInput',
  component: AmountInput,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof AmountInput>

export default meta
type Story = StoryObj

function ControlledInput(props: { signButtons?: boolean | 'auto' }) {
  const [value, setValue] = useState(1250)
  const [committed, setCommitted] = useState<number>()
  return (
    <div>
      <AmountInput
        label="Amount"
        value={value}
        currency="RUB"
        signButtons={props.signButtons}
        onChange={setValue}
        onEnter={setCommitted}
        selectOnFocus
        className="w-[280px]"
      />
      <output data-testid="value">{value}</output>
      <output data-testid="committed">{committed}</output>
      <button type="button">Outside field</button>
    </div>
  )
}

export const Default: Story = {
  render: () => <ControlledInput />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole('textbox', { name: 'Amount' })
    await userEvent.click(input)
    await userEvent.clear(input)
    await userEvent.type(input, '1,5+2*3')
    await expect(canvas.getByTestId('value')).toHaveTextContent('7.5')
    await userEvent.keyboard('{Enter}')
    await expect(canvas.getByTestId('committed')).toHaveTextContent('7.5')
    await userEvent.click(canvas.getByRole('button', { name: 'Outside field' }))
    await expect(input).toHaveValue('7,50')
    await userEvent.click(input)
    await userEvent.clear(input)
    await userEvent.type(input, '-12.5')
    await expect(canvas.getByTestId('value')).toHaveTextContent('-12.5')
    await userEvent.clear(input)
    await expect(canvas.getByTestId('value')).toHaveTextContent('0')
  },
}

export const WithExpressionButtons: Story = {
  render: () => <ControlledInput signButtons />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole('textbox', { name: 'Amount' })
    await userEvent.click(input)
    await userEvent.clear(input)
    await userEvent.type(input, '12')
    await userEvent.click(canvas.getByRole('button', { name: '+' }))
    await expect(input).toHaveFocus()
    await userEvent.keyboard('{End}3{Enter}')
    await expect(canvas.getByTestId('committed')).toHaveTextContent('15')
  },
}

function FieldVariants() {
  return (
    <div className="flex flex-col gap-8">
      {(['medium', 'small'] as const).map(size => (
        <AmountInput
          key={size}
          size={size}
          label="Amount"
          value={1250}
          currency="RUB"
          helperText="Balance"
          className="w-[280px]"
          onChange={() => {}}
          readOnly
        />
      ))}
    </div>
  )
}

export const FieldSizes: Story = { render: () => <FieldVariants /> }

export const DarkFieldSizes: Story = {
  ...FieldSizes,
  globals: { theme: 'dark' },
}

/** The shape real callers use: an icon button sitting in the adornment. */
function AdornmentButtonFields() {
  const submit = (
    <IconButton edge="end" aria-label="Apply">
      <ArrowForwardIcon />
    </IconButton>
  )
  return (
    <div data-testid="adornment">
      <AmountInput
        label="Amount"
        value={1250}
        className="w-[280px]"
        onChange={() => {}}
        readOnly
        endAdornment={submit}
      />
    </div>
  )
}

export const AdornmentButtonFocus: Story = {
  render: () => <AdornmentButtonFields />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const notch = () =>
      getComputedStyle(
        canvas.getByTestId('adornment').querySelector('fieldset')!
      ).borderTopWidth
    const field = within(canvas.getByTestId('adornment'))
    const resting = notch()
    await userEvent.click(field.getByRole('textbox'))
    await expect(notch()).toBe('2px')
    await userEvent.tab()
    await expect(field.getByRole('button', { name: 'Apply' })).toHaveFocus()
    await expect(notch()).toBe(resting)
  },
}
