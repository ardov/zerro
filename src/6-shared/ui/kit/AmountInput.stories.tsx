import { useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { ArrowRight, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { formatMoney } from '@/6-shared/helpers/money/format'
import { round } from '@/6-shared/helpers/money/currencyHelpers'
import {
  AmountInput,
  AmountInlineField,
  type AmountInputProps,
} from './AmountInput'
import { Button, IconButton } from './Button'
import { FieldAddon, FieldSurface } from './Field'
import { Menu } from './Menu'

const meta = {
  title: 'UI Kit/Inputs/Amount input',
  component: AmountInput,
  subcomponents: { AmountInlineField },
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `AmountInput uses the same field and addon slots as Input. AmountInlineField builds on InlineField, inherits typography and fits its text, for headlines and composed rows. The inline variant has no error or description messages; its caller owns error feedback. Both keep a numeric value while editing a formatted arithmetic expression.

Use value and onChange for the amount, and onEnter when the form should apply it. Empty input is zero. Invalid expressions settle to the last valid amount on Enter or when focus leaves the entire editor; moving to an addon preserves the expression. Arithmetic supports +, −, ×, ÷ and decimal commas or points. Only the result is rounded to two decimals; percentages are not operators.

Put currencies, units and transaction direction in start/end. Enable operators for an on-screen calculator row. Set typography on the AmountInlineField wrapper. External value changes replace the draft, while an echo of onChange preserves the expression. Use a React key when changing records with the same numeric value.`,
      },
    },
  },
  args: { label: 'Amount', value: 1250, onChange: () => {} },
  decorators: [
    Story => (
      <main className="min-h-screen bg-ui-base p-4 text-ui-16 text-ui-primary sm:p-6">
        <div className="mx-auto max-w-3xl">
          <Story />
        </div>
      </main>
    ),
  ],
} satisfies Meta<typeof AmountInput>
export default meta
type Story = StoryObj<typeof meta>

function FieldExamples() {
  const [budget, setBudget] = useState(12500)
  const [applied, setApplied] = useState(12500)
  const [percent, setPercent] = useState(15)
  const [calculation, setCalculation] = useState(1250)
  const [currency, setCurrency] = useState('EUR')
  return (
    <section className="grid gap-5 rounded-ui-card rounded-smooth bg-ui-card p-5 sm:p-6">
      <div>
        <h2 className="m-0 text-ui-20 font-medium">Everyday amounts</h2>
        <p className="mt-1 text-ui-14 text-ui-secondary">
          Type a number or work out a sum in place.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <AmountInput
          label="Monthly budget"
          labelMode="floating"
          value={budget}
          onChange={setBudget}
          onEnter={setApplied}
          start={<FieldAddon>CZK</FieldAddon>}
          end={
            <FieldAddon kind="action">
              <IconButton
                label="Apply budget"
                variant="ghost"
                size="sm"
                onClick={() => setApplied(budget)}
              >
                <ArrowRight />
              </IconButton>
            </FieldAddon>
          }
          description={`Applied: ${formatMoney(applied, 'CZK')}`}
        />
        <AmountInput
          label="Share of income"
          labelMode="floating"
          value={percent}
          onChange={setPercent}
          end={<FieldAddon>%</FieldAddon>}
          description="The addon is a unit, separate from arithmetic."
        />
      </div>
      <AmountInput
        label="Calculate an amount"
        value={calculation}
        onChange={setCalculation}
        operators
        end={
          <FieldAddon kind="action">
            <Menu
              label="Currency"
              trigger={
                <Button aria-label="Choose currency" size="sm" variant="ghost">
                  {currency}
                </Button>
              }
              items={['EUR', 'CZK', 'USD'].map(code => ({
                id: code,
                label: code,
                onSelect: () => setCurrency(code),
              }))}
            />
          </FieldAddon>
        }
        description={`Result: ${formatMoney(calculation, currency)}`}
      />
    </section>
  )
}

function TransactionExample() {
  const [amount, setAmount] = useState(3240)
  const [income, setIncome] = useState(false)
  const [saved, setSaved] = useState<number>()
  return (
    <section className="grid gap-6 rounded-ui-card rounded-smooth bg-ui-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-ui-20 font-medium">Transaction amount</h2>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={income ? 'ghost' : 'secondary'}
            aria-pressed={!income}
            onClick={() => setIncome(false)}
          >
            Expense
          </Button>
          <Button
            size="sm"
            variant={income ? 'secondary' : 'ghost'}
            aria-pressed={income}
            onClick={() => setIncome(true)}
          >
            Income
          </Button>
        </div>
      </div>
      <div className="flex min-w-0 justify-center py-6">
        <AmountInlineField
          label="Transaction amount"
          value={amount}
          onChange={setAmount}
          onEnter={setSaved}
          className="text-4xl font-semibold"
          selectOnFocus
          start={<span aria-hidden>{income ? '+' : '−'}</span>}
          end={
            <span className="text-ui-16 font-medium text-ui-secondary">
              CZK
            </span>
          }
        />
      </div>
      <p className="m-0 text-center text-ui-14 text-ui-secondary">
        {saved === undefined
          ? 'Try 12000/3+250. Enter applies the result.'
          : `Applied: ${formatMoney(saved, 'CZK')}`}
      </p>
    </section>
  )
}

function TransferExample() {
  const fromRef = useRef<HTMLInputElement>(null)
  const toRef = useRef<HTMLInputElement>(null)
  const [from, setFrom] = useState(100)
  const [to, setTo] = useState(2500)
  return (
    <section className="grid gap-5 rounded-ui-card rounded-smooth bg-ui-card p-5 sm:p-6">
      <div>
        <h2 className="m-0 text-ui-20 font-medium">Amounts inside a row</h2>
        <p className="mt-1 text-ui-14 text-ui-secondary">
          Linked fields, using an example rate of 1 EUR = 25 CZK.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldSurface
          controlRef={fromRef}
          data-testid="send-surface"
          start={
            <FieldAddon kind="icon">
              <ArrowUpRight aria-hidden size={20} />
            </FieldAddon>
          }
        >
          <AmountInlineField
            ref={fromRef}
            label="Send amount"
            value={from}
            onChange={value => {
              setFrom(value)
              setTo(round(value * 25))
            }}
            end={<span className="text-ui-secondary">EUR</span>}
            className="py-3"
          />
        </FieldSurface>
        <FieldSurface
          controlRef={toRef}
          data-testid="receive-surface"
          start={
            <FieldAddon kind="icon">
              <ArrowDownLeft aria-hidden size={20} />
            </FieldAddon>
          }
        >
          <AmountInlineField
            ref={toRef}
            label="Receive amount"
            value={to}
            onChange={value => {
              setTo(value)
              setFrom(round(value / 25))
            }}
            end={<span className="text-ui-secondary">CZK</span>}
            className="py-3"
          />
        </FieldSurface>
      </div>
    </section>
  )
}

function States() {
  const [amount, setAmount] = useState(50)
  return (
    <section className="grid gap-5 rounded-ui-card rounded-smooth bg-ui-card p-5 sm:p-6">
      <h2 className="m-0 text-ui-20 font-medium">Size and availability</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <AmountInput
          label="Compact amount"
          size="sm"
          value={amount}
          onChange={setAmount}
          end={<FieldAddon>EUR</FieldAddon>}
        />
        <AmountInput
          label="External validation"
          value={amount}
          onChange={setAmount}
          error="This amount exceeds the available balance."
        />
        <AmountInput
          label="Read only"
          value={1250}
          onChange={() => {}}
          readOnly
        />
        <AmountInput
          label="Unavailable"
          value={1250}
          onChange={() => {}}
          disabled
        />
      </div>
    </section>
  )
}

export const Showcase: Story = {
  render: () => (
    <div className="grid gap-6">
      <FieldExamples />
      <TransactionExample />
      <TransferExample />
      <States />
    </div>
  ),
}

export const Playground: Story = {
  render: function Render(args) {
    const [value, setValue] = useState(args.value)
    return <AmountInput {...args} value={value} onChange={setValue} />
  },
}

export const PopupAddon: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <FieldExamples />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole('textbox', { name: 'Calculate an amount' })
    await userEvent.clear(input)
    await userEvent.type(input, '12000/3')
    await userEvent.click(
      canvas.getByRole('button', { name: 'Choose currency' })
    )
    await userEvent.keyboard('{ArrowDown}')
    await expect(input).toHaveValue('12\u00a0000/3')
    await userEvent.click(
      within(document.body).getByRole('menuitem', { name: 'CZK' })
    )
    await expect(input).toHaveValue('12\u00a0000/3')
    await userEvent.click(input)
    await userEvent.keyboard('{End}+2{Enter}')
    await expect(input).toHaveValue('4\u00a0002,00')
  },
}

function EditingExample(props: { text?: boolean } & Partial<AmountInputProps>) {
  const { text, ...restProps } = props
  const [value, setValue] = useState(0)
  const [applied, setApplied] = useState(0)
  const Control = text ? AmountInlineField : AmountInput
  return (
    <div className="grid max-w-sm gap-4">
      <Control
        label="Amount"
        {...restProps}
        value={value}
        onChange={setValue}
        onEnter={setApplied}
      />
      <output data-testid="value">{value}</output>
      <output data-testid="applied">{applied}</output>
      <Button variant="secondary">Outside editor</Button>
    </div>
  )
}

export const Editing: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <EditingExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole<HTMLInputElement>('textbox', {
      name: 'Amount',
    })
    await userEvent.click(input)
    await userEvent.type(input, '12000/3+2500,5')
    await expect(input).toHaveValue('12\u00a0000/3+2\u00a0500,5')
    await expect(canvas.getByTestId('value')).toHaveTextContent(/^6500.5$/)
    await userEvent.keyboard('{Control>}z{/Control}')
    await expect(input).toHaveValue('12\u00a0000/3+2\u00a0500,')
    await userEvent.keyboard('{Control>}{Shift>}z{/Shift}{/Control}')
    await expect(input).toHaveValue('12\u00a0000/3+2\u00a0500,5')
    await userEvent.keyboard('{Enter}')
    await expect(input).toHaveValue('6\u00a0500,50')
    await expect(canvas.getByTestId('applied')).toHaveTextContent(/^6500.5$/)
    input.setSelectionRange(2, 2)
    await userEvent.keyboard('{Backspace}')
    await expect(input).toHaveValue('500,50')
    await expect(input.selectionStart).toBe(0)
    input.setSelectionRange(2, 2)
    await userEvent.keyboard('x')
    await expect(input.selectionStart).toBe(2)
    await userEvent.clear(input)
    await userEvent.type(input, '12/0')
    await userEvent.click(
      canvas.getByRole('button', { name: 'Outside editor' })
    )
    await expect(input).toHaveValue('12,00')
  },
}

export const InlineEditing: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <EditingExample
      text
      operators
      className="text-4xl font-semibold"
      end={<span className="text-ui-16">CZK</span>}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole<HTMLInputElement>('textbox', {
      name: 'Amount',
    })
    await userEvent.click(input)
    await userEvent.type(input, '2*3000+4000')
    await expect(input).toHaveValue('2*3\u00a0000+4\u00a0000')
    await expect(canvas.getByTestId('value')).toHaveTextContent(/^10000$/)
    for (const [inputType, expected] of [
      ['historyUndo', '2*3\u00a0000+400'],
      ['historyRedo', '2*3\u00a0000+4\u00a0000'],
    ]) {
      const event = new InputEvent('beforeinput', {
        bubbles: true,
        cancelable: true,
        inputType,
      })
      input.dispatchEvent(event)
      await expect(event.defaultPrevented).toBe(true)
      await waitFor(() => expect(input).toHaveValue(expected))
    }
    await expect(getComputedStyle(input).fontSize).toBe(
      getComputedStyle(input.parentElement!).fontSize
    )
    await expect(input.getBoundingClientRect().right).toBeLessThanOrEqual(
      canvasElement.getBoundingClientRect().right
    )
    input.setSelectionRange(1, 2)
    await userEvent.click(canvas.getByRole('button', { name: '+' }))
    await expect(input).toHaveFocus()
    await expect(input).toHaveValue('2+3\u00a0000+4\u00a0000')
    await expect(input.selectionStart).toBe(2)
    await userEvent.keyboard('{Enter}')
    await expect(input).toHaveValue('7\u00a0002')
    await expect(canvas.getByTestId('applied')).toHaveTextContent(/^7002$/)
  },
}

export const RowFocus: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <TransferExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    for (const [surfaceName, label, currency] of [
      ['send-surface', 'Send amount', 'EUR'],
      ['receive-surface', 'Receive amount', 'CZK'],
    ]) {
      const surface = canvas.getByTestId(surfaceName)
      const input = canvas.getByRole('textbox', { name: label })
      await userEvent.click(surface)
      await expect(input).toHaveFocus()
      input.blur()
      await userEvent.click(surface.querySelector('svg')!)
      await expect(input).toHaveFocus()
      input.blur()
      await userEvent.click(within(surface).getByText(currency))
      await expect(input).toHaveFocus()
    }
  },
}
