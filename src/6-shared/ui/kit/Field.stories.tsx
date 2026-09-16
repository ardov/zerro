import { useRef, useState } from 'react'
import { expect, userEvent, waitFor } from 'storybook/test'
import { SearchIcon } from 'lucide-react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { CalendarIcon, CloseIcon } from '@/6-shared/ui/Icons'
import { Button, IconButton } from './Button'
import { cn } from '@/6-shared/ui/shadcn/utils'
import { FieldSurface, FieldAddon, fieldControlClass } from './Field'
import { Input } from './Input'
import { Textarea } from './Textarea'

const meta = {
  tags: ['autodocs'],
  title: 'UI Kit/Inputs/Text fields',
  component: Input,
  parameters: {
    docs: {
      description: {
        component:
          'Input and Textarea share labels, validation and addon slots. Use floating labels when the label belongs inside the control. Start and end slots hold icons, text or actions; Textarea grows with its content. Try the search clear button and native date picker in the showcase.',
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
      onChange={event => setValue(event.target.value)}
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
        onChange={event => setValue(event.target.value)}
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
