import { useRef, useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { SearchIcon } from 'lucide-react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { CalendarIcon, CloseIcon } from '@/6-shared/ui/Icons'
import { Button, IconButton } from './Button'
import { cn } from '@/6-shared/ui/shadcn/utils'
import { FieldSurface, FieldAddon, fieldControlClass } from './Field'
import { Input } from './Input'
import { AmountInput } from './AmountInput'
import { Textarea } from './Textarea'

const meta = {
  tags: ['autodocs'],
  title: 'UI Kit/Inputs/Text fields',
  component: Input,
  parameters: {
    docs: {
      description: {
        component:
          'Input and Textarea share labels, validation and addon slots. Use floating labels when the label belongs inside the control. Use prefix/suffix for non-editable text in the value row (Input and AmountInput); suffix stays adjacent to the typed value, including expressions. Affixes are announced as descriptions, clicking them focuses the input, and they add no Tab stops. Start and end slots hold icons, text or actions; Textarea grows with its content. Try the search clear button and native date picker in the showcase.',
      },
    },
    controls: { disable: true },
    layout: 'fullscreen',
  },
  args: { label: 'Name', labelMode: 'floating' },
  decorators: [
    Story => (
      <main className="min-h-screen bg-ui-base p-6 font-sans text-ui-16 text-ui-primary">
        <div className="mx-auto max-w-3xl rounded-ui-card bg-ui-card p-6 shadow-ui-card">
          <Story />
        </div>
      </main>
    ),
  ],
} satisfies Meta<typeof Input>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

function SearchExample() {
  const [value, setValue] = useState('Groceries')
  return (
    <Input
      label="Search"
      placeholder="Search"
      value={value}
      onValueChange={setValue}
      start={
        <FieldAddon kind="icon">
          <SearchIcon size={20} />
        </FieldAddon>
      }
      end={
        <FieldAddon kind="action">
          <IconButton
            variant="ghost"
            size="sm"
            label="Clear search"
            onClick={() => setValue('')}
          >
            <CloseIcon />
          </IconButton>
        </FieldAddon>
      }
    />
  )
}

function DateTimeExample() {
  const dateRef = useRef<HTMLInputElement>(null)
  return (
    <FieldSurface
      start={
        <FieldAddon kind="action">
          <IconButton
            variant="ghost"
            size="sm"
            label="Open calendar"
            onClick={() => {
              dateRef.current?.focus()
              dateRef.current?.showPicker?.()
            }}
          >
            <CalendarIcon />
          </IconButton>
        </FieldAddon>
      }
    >
      <input
        ref={dateRef}
        type="date"
        aria-label="Date"
        defaultValue="2026-09-12"
        className={cn(
          fieldControlClass,
          'flex-1 [&::-webkit-calendar-picker-indicator]:hidden'
        )}
      />
      <input
        type="time"
        aria-label="Time"
        defaultValue="18:56"
        className={cn(
          fieldControlClass,
          'w-24 shrink-0 text-ui-secondary [&::-webkit-calendar-picker-indicator]:hidden'
        )}
      />
    </FieldSurface>
  )
}

export const Showcase: Story = {
  render: () => (
    <div className="grid gap-8">
      <section className="grid gap-4">
        <h2 className="m-0 text-ui-16 font-medium">Field anatomy · 48 px</h2>
        <Input label="Without an icon" placeholder="Comment" />
        <Input
          label="With an icon"
          placeholder="Comment"
          start={
            <FieldAddon kind="icon">
              <SearchIcon size={20} />
            </FieldAddon>
          }
        />
        <Input
          label="With an icon button"
          placeholder="Comment"
          start={
            <FieldAddon kind="action">
              <IconButton variant="ghost" size="sm" label="Search">
                <SearchIcon />
              </IconButton>
            </FieldAddon>
          }
        />
        <Input
          label="With a text addon"
          placeholder="Comment"
          start={<FieldAddon>USD</FieldAddon>}
          end={<FieldAddon>Addon</FieldAddon>}
        />
        <Input
          label="With a text button"
          placeholder="Comment"
          end={
            <FieldAddon kind="action">
              <Button variant="ghost" size="sm">
                Text Button
              </Button>
            </FieldAddon>
          }
        />
      </section>
      <section className="grid gap-4">
        <h2 className="m-0 text-ui-20 font-medium">Fields</h2>
        <p className="m-0 text-ui-14 text-ui-secondary">
          Try typing, tabbing, clearing the search and opening the native
          calendar.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Comment" placeholder="Comment" />
          <Input
            label="Search transactions"
            placeholder="Search transactions"
            start={
              <FieldAddon kind="icon">
                <SearchIcon size={20} />
              </FieldAddon>
            }
          />
          <SearchExample />
          <DateTimeExample />
        </div>
      </section>
      <section className="grid gap-4">
        <h2 className="m-0 text-ui-16 font-medium">Floating labels</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Envelope name" labelMode="floating" />
          <Input
            label="Envelope name"
            labelMode="floating"
            defaultValue="Groceries"
          />
          <Input
            label="Search"
            labelMode="floating"
            start={
              <FieldAddon kind="icon">
                <SearchIcon size={20} />
              </FieldAddon>
            }
          />
          <Input
            label="Search"
            labelMode="floating"
            start={
              <FieldAddon kind="icon">
                <SearchIcon size={20} />
              </FieldAddon>
            }
            defaultValue="Coffee"
          />
        </div>
      </section>
      <section className="grid gap-4">
        <h2 className="m-0 text-ui-16 font-medium">States</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Required field"
            placeholder="Name"
            error="This field is required"
          />
          <Input
            label="Name"
            labelMode="floating"
            defaultValue="Groceries"
            error="This name already exists"
          />
          <Input
            label="Read only"
            labelMode="floating"
            defaultValue="You can select and copy this text"
            readOnly
          />
          <Input
            label="Disabled field"
            labelMode="floating"
            defaultValue="Unavailable"
            disabled
          />
        </div>
      </section>
      <section className="grid gap-4">
        <h2 className="m-0 text-ui-16 font-medium">Multiple lines</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Textarea label="Comment" placeholder="Comment" />
          <Textarea
            label="Comment"
            labelMode="floating"
            defaultValue={'Weekly shopping\nVegetables, fruit and coffee'}
            description="The label stays at the top as the field grows."
          />
        </div>
      </section>
    </div>
  ),
}

function FloatingLabelExample() {
  const [value, setValue] = useState('')
  return (
    <>
      <Input
        label="Floating label"
        labelMode="floating"
        value={value}
        onValueChange={setValue}
      />
      <Button onClick={() => setValue('Updated')}>Set value</Button>
      <Button onClick={() => setValue('')}>Clear value</Button>
    </>
  )
}

export const FloatingLabelInteraction: Story = {
  render: () => <FloatingLabelExample />,
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Floating label' })
    const label = canvas.getByText('Floating label', { selector: 'label' })
    const raised = () =>
      label.getBoundingClientRect().bottom <= input.getBoundingClientRect().top
    await expect(input).not.toHaveAttribute('placeholder')
    await waitFor(() => expect(raised()).toBe(false))
    await userEvent.click(input)
    await waitFor(() => expect(raised()).toBe(true))
    await userEvent.type(input, 'Typed')
    await userEvent.tab()
    await waitFor(() => expect(raised()).toBe(true))
    await userEvent.click(canvas.getByRole('button', { name: 'Clear value' }))
    await waitFor(() => expect(raised()).toBe(false))
    await userEvent.click(canvas.getByRole('button', { name: 'Set value' }))
    await expect(input).toHaveValue('Updated')
    await waitFor(() => expect(raised()).toBe(true))
  },
}

export const GrowingTextarea: Story = {
  render: () => (
    <div className="grid gap-4">
      <Input label="Single line" />
      <Textarea label="Growing" maxRows={3} />
      <Textarea label="Two lines minimum" minRows={2} />
    </div>
  ),
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Single line' })
    const textarea = canvas.getByRole('textbox', { name: 'Growing' })
    const minimum = canvas.getByRole('textbox', { name: 'Two lines minimum' })
    const height = (element: HTMLElement) =>
      element.getBoundingClientRect().height
    const initial = height(textarea)
    await expect(initial).toBe(height(input))
    await expect(height(minimum)).toBeCloseTo(initial * 2, 0)
    await userEvent.type(textarea, 'First{Enter}Second')
    await waitFor(() => expect(height(textarea)).toBeGreaterThan(initial))
    await userEvent.type(textarea, '{Enter}Third{Enter}Fourth{Enter}Fifth')
    await waitFor(() => {
      expect(height(textarea)).toBeCloseTo(initial * 3, 0)
      expect(textarea.scrollHeight).toBeGreaterThan(textarea.clientHeight)
    })
    await userEvent.clear(textarea)
    await waitFor(() => expect(height(textarea)).toBe(initial))
  },
}

export const MultilineIconAlignment: Story = {
  render: () => (
    <div className="grid gap-4">
      {(['lg', 'sm'] as const).map(size => (
        <Textarea
          key={size}
          size={size}
          label={`Multiline comment ${size}`}
          defaultValue={'First line\nSecond line\nThird line'}
          start={
            <FieldAddon kind="icon">
              <SearchIcon data-testid={`comment-icon-${size}`} size={20} />
            </FieldAddon>
          }
        />
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    for (const size of ['lg', 'sm']) {
      const control = canvas.getByRole('textbox', {
        name: `Multiline comment ${size}`,
      })
      const icon = canvas.getByTestId(`comment-icon-${size}`)
      const firstLineCenter =
        control.getBoundingClientRect().top +
        parseFloat(getComputedStyle(control).lineHeight) / 2
      const bounds = icon.getBoundingClientRect()
      expect(
        Math.abs(bounds.top + bounds.height / 2 - firstLineCenter)
      ).toBeLessThan(2)
    }
  },
}

/** Focus belongs to the editable area or its action, never to both. */
export const ActionAddonFocus: Story = {
  render: () => <SearchExample />,
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Search' })
    const action = canvas.getByRole('button', { name: 'Clear search' })
    const surface = input.closest('[data-field-control]')!.parentElement!
    const ring = () => getComputedStyle(surface).boxShadow
    await userEvent.click(input)
    const focusedRing = ring()
    await userEvent.tab()
    await expect(action).toHaveFocus()
    await expect(action.matches(':focus-visible')).toBe(true)
    await expect(ring()).not.toBe(focusedRing)
    const actionRing = ring()
    await userEvent.tab({ shift: true })
    await expect(input).toHaveFocus()
    await expect(ring()).toBe(focusedRing)
    await userEvent.tab()
    await expect(ring()).toBe(actionRing)
    await userEvent.keyboard('{Enter}')
    await expect(input).toHaveValue('')
  },
}

export const FloatingTextAddons: Story = {
  render: () => (
    <div className="grid w-80 gap-4">
      {(['lg', 'sm'] as const).map(size => (
        <Input
          key={size}
          size={size}
          label={`Amount ${size}`}
          labelMode="floating"
          defaultValue="125"
          start={
            <FieldAddon>
              <span>USD</span>
            </FieldAddon>
          }
          end={
            <FieldAddon>
              <span>kg</span>
            </FieldAddon>
          }
        />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    for (const size of ['lg', 'sm']) {
      const input = canvas.getByRole('textbox', { name: `Amount ${size}` })
      const surface = input.closest('[data-field-control]')!.parentElement!
      const value = input.getBoundingClientRect()
      for (const span of surface.querySelectorAll(
        '[data-field-addon-side] span'
      )) {
        const addon = span.getBoundingClientRect()
        await expect(
          Math.abs(addon.top + addon.height / 2 - value.top - value.height / 2)
        ).toBeLessThan(1)
      }
    }
  },
}

function ValueAffixesExample() {
  const [amount, setAmount] = useState(12.5)
  return (
    <div className="grid w-80 max-w-full gap-4">
      <Input
        label="Price"
        labelMode="floating"
        prefix="USD"
        defaultValue="1250"
      />
      <AmountInput
        label="Income share"
        labelMode="floating"
        suffix="%"
        value={amount}
        onChange={setAmount}
        description="Share of monthly income"
      />
      <Input label="Distance" prefix="≈" suffix="km" defaultValue="12" />
      <Input label="Empty value" labelMode="floating" suffix="kg" />
      <Input
        label="Disabled value"
        labelMode="floating"
        prefix="EUR"
        suffix="/mo"
        defaultValue="100"
        disabled
      />
      <button type="button" onClick={() => setAmount(7)}>
        Reset share
      </button>
    </div>
  )
}

export const ValueAffixes: Story = {
  render: () => <ValueAffixesExample />,
  play: async ({ canvas }) => {
    const price = canvas.getByRole('textbox', { name: 'Price' })
    const share = canvas.getByRole('textbox', { name: 'Income share' })
    await userEvent.click(canvas.getByText('USD', { exact: true }))
    await expect(price).toHaveFocus()
    await expect(price).toHaveValue('1250')
    await expect(price).toHaveAccessibleDescription('USD')
    await userEvent.tab()
    await expect(share).toHaveFocus()
    await expect(share).toHaveAccessibleDescription(/Share of monthly income/)
    await expect(share).toHaveAccessibleDescription(/%/)
    const suffix = canvas.getByText('%', { exact: true })
    await userEvent.click(suffix)
    await expect(share).toHaveFocus()
    const gap = () =>
      suffix.getBoundingClientRect().left - share.getBoundingClientRect().right
    await expect(gap()).toBeGreaterThanOrEqual(3)
    await expect(gap()).toBeLessThan(6)
    const width = share.getBoundingClientRect().width
    await userEvent.clear(share)
    await userEvent.type(share, '12345678901234567890+12345678901234567890')
    await expect(share.getBoundingClientRect().width).toBeGreaterThan(width)
    await expect(suffix.getBoundingClientRect().right).toBeLessThanOrEqual(
      share.closest('[data-field-control]')!.getBoundingClientRect().right
    )
    await userEvent.clear(share)
    await userEvent.type(share, '25/2{Enter}')
    await expect(share).toHaveValue('12,50')
    await userEvent.click(canvas.getByRole('button', { name: 'Reset share' }))
    await expect(share).toHaveValue('7')
    await expect(share.getBoundingClientRect().width).toBeLessThan(width)
    await userEvent.click(canvas.getByText('kg', { exact: true }))
    await expect(
      canvas.getByRole('textbox', { name: 'Empty value' })
    ).toHaveFocus()
  },
}

export const FloatingLabelFocus: Story = {
  render: () => (
    <div className="grid w-80 gap-4">
      <Input label="Empty label" labelMode="floating" />
      <Input
        label="Amount label"
        labelMode="floating"
        defaultValue="125"
        prefix="USD"
      />
      <Textarea
        label="Comment label"
        labelMode="floating"
        defaultValue="A note"
      />
      <Input label="Disabled label" labelMode="floating" disabled />
    </div>
  ),
  play: async ({ canvas }) => {
    for (const name of ['Empty label', 'Amount label', 'Comment label']) {
      const label = canvas.getByText(name, { selector: 'label' })
      await userEvent.click(label.parentElement!)
      await expect(canvas.getByRole('textbox', { name })).toHaveFocus()
    }
    await expect(
      canvas.getByRole('textbox', { name: 'Disabled label' })
    ).toBeDisabled()
  },
}
