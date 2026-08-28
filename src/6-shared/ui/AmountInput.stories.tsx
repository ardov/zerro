import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { InputAdornment, TextField } from '@mui/material'
import { IconButton } from './Button'
import { ArrowForwardIcon } from './feather'
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

function ParityFields() {
  return (
    <div className="flex flex-col gap-8">
      {(['medium', 'small'] as const).map(size => (
        <div key={size} className="flex flex-wrap gap-8">
          <div data-testid={`mui-${size}`}>
            <TextField
              size={size}
              label="Amount"
              value="1 250,00"
              helperText="Balance"
              className="w-[280px]"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">₽</InputAdornment>
                  ),
                },
                htmlInput: { readOnly: true },
              }}
            />
          </div>
          <div data-testid={`owned-${size}`}>
            <AmountInput
              size={size}
              label="Amount"
              value={1250}
              currency="RUB"
              helperText="Balance"
              className="w-[280px]"
              onChange={() => {}}
              readOnly
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export const OutlinedFieldParity: Story = {
  render: () => <ParityFields />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    for (const size of ['medium', 'small']) {
      const legacy = canvas.getByTestId(`mui-${size}`)
      const owned = canvas.getByTestId(`owned-${size}`)
      const measure = (root: HTMLElement) => {
        const input = root.querySelector('input')!
        const fieldset = root.querySelector('fieldset')!
        const s = getComputedStyle(input)
        const border = getComputedStyle(fieldset)
        const rect = input.getBoundingClientRect()
        return {
          height: rect.height,
          width: rect.width,
          fontSize: s.fontSize,
          lineHeight: s.lineHeight,
          padding: s.padding,
          color: s.color,
          border: border.border,
          radius: border.borderRadius,
        }
      }
      await expect(measure(owned)).toEqual(measure(legacy))
      await userEvent.click(within(legacy).getByRole('textbox'))
      const focused = measure(legacy)
      await userEvent.click(within(owned).getByRole('textbox'))
      await expect(measure(owned)).toEqual(focused)
      await expect(
        within(owned).getByRole('textbox')
      ).toHaveAccessibleDescription('Balance')
    }
  },
}

export const DarkOutlinedFieldParity: Story = {
  ...OutlinedFieldParity,
  globals: { theme: 'dark' },
}

/** The shape both real callers use: an icon button sitting in the adornment.
 *
 * MUI paints the focus ring from the input's own focus handler, so reaching
 * the button leaves the resting border. The parity matrix above cannot catch
 * a regression here — its adornment is a plain currency symbol, and only a
 * focusable one tells `:focus-within` and input focus apart. */
function AdornmentButtonFields() {
  const submit = (
    <IconButton edge="end" aria-label="Apply">
      <ArrowForwardIcon />
    </IconButton>
  )
  return (
    <div className="flex flex-wrap gap-8">
      <div data-testid="mui-adornment">
        <TextField
          label="Amount"
          value="1 250,00"
          className="w-[280px]"
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">{submit}</InputAdornment>
              ),
            },
            htmlInput: { readOnly: true },
          }}
        />
      </div>
      <div data-testid="owned-adornment">
        <AmountInput
          label="Amount"
          value={1250}
          className="w-[280px]"
          onChange={() => {}}
          readOnly
          endAdornment={submit}
        />
      </div>
    </div>
  )
}

export const AdornmentButtonFocus: Story = {
  render: () => <AdornmentButtonFields />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const notch = (testId: string) =>
      getComputedStyle(canvas.getByTestId(testId).querySelector('fieldset')!)
        .borderTopWidth
    const resting = notch('mui-adornment')

    for (const testId of ['mui-adornment', 'owned-adornment']) {
      const field = within(canvas.getByTestId(testId))
      await userEvent.click(field.getByRole('textbox'))
      await expect(notch(testId)).toBe('2px')
      // Tabbing on to the adornment button drops the ring in both.
      await userEvent.tab()
      await expect(field.getByRole('button', { name: 'Apply' })).toHaveFocus()
      await expect(notch(testId)).toBe(resting)
    }
  },
}
