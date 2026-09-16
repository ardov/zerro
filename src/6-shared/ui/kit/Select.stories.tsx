import { usePopup } from '@/6-shared/overlays'
import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within, waitFor } from 'storybook/test'
import { Wallet, Landmark, Plus } from 'lucide-react'
import { Select, type SelectItem } from './Select'
import { Button } from './Button'

const items: SelectItem[] = [
  {
    type: 'group',
    id: 'bank',
    label: 'Bank accounts',
    items: [
      {
        value: 'daily',
        label: 'Everyday account',
        start: <Wallet />,
        description: 'Daily spending',
        end: 'CZK',
      },
      {
        value: 'savings',
        label: 'Savings',
        start: <Landmark />,
        description: 'Long-term reserve',
        end: 'EUR',
      },
      { value: 'closed', label: 'Closed account', disabled: true },
    ],
  },
  { type: 'separator', id: 'cash-separator' },
  { value: 'cash', label: 'Cash' },
]
const meta = {
  title: 'UI Kit/Select',
  component: Select,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `Single selection with keyboard navigation, grouped options and optional images.

\`<Select label="Account" items={items} value={value} onChange={setValue} />\`

- Use stable string values; **null** means empty. Options have a string **label**, optional **start**, **description**, **end**, and **disabled**.
- Groups use **{ type: 'group', id, label, items }**; dividers use **{ type: 'separator', id }**. Groups are flat.
- Disabled rows remain keyboard-focusable but cannot be selected.
- **required** prevents clearing. **readOnly** keeps the field focusable; **name** includes its value in form submission.
- **alignSelected** opts into Base UI text alignment for short lists. Touch and constrained space can fall back to ordinary positioning; native overlap closes on window resize.
- **trigger** accepts a custom button; **renderValue** formats the closed value, and **showValueIcon={false}** hides only its image.
`,
      },
    },
  },
  args: { label: 'Account', items, value: 'daily', onChange: () => {} },
} satisfies Meta<typeof Select>
export default meta
type Story = StoryObj<typeof meta>
function Demo() {
  const [value, setValue] = useState<string | null>('daily')
  return (
    <div className="grid max-w-sm gap-4">
      <Select label="Account" items={items} value={value} onChange={setValue} />
      <Button variant="secondary">Next control</Button>
      <output aria-label="Selected value">{value ?? 'none'}</output>
    </div>
  )
}
export const Playground: Story = { render: () => <Demo /> }
export const Interaction: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole('combobox')
    await userEvent.click(trigger)
    const list = await body.findByRole('listbox', { name: 'Account' })
    const options = within(list)
    await expect(
      options.getByRole('option', { name: /Everyday account/ })
    ).toHaveAttribute('aria-selected', 'true')
    await userEvent.hover(options.getByRole('option', { name: 'Cash' }))
    await waitFor(() =>
      expect(options.getByRole('option', { name: 'Cash' })).toHaveAttribute(
        'data-highlighted'
      )
    )
    await userEvent.keyboard('{ArrowUp}')
    await waitFor(() =>
      expect(
        options.getByRole('option', { name: 'Closed account' })
      ).toHaveAttribute('data-highlighted')
    )
    await userEvent.keyboard('{Enter}')
    await expect(canvas.getByLabelText('Selected value')).toHaveTextContent(
      'daily'
    )
    await expect(list).toBeVisible()
    await userEvent.keyboard('{ArrowUp}')
    await waitFor(() =>
      expect(options.getByRole('option', { name: /Savings/ })).toHaveAttribute(
        'data-highlighted'
      )
    )
    await expect(list.querySelectorAll('[data-highlighted]')).toHaveLength(1)
    await userEvent.keyboard('{Enter}')
    await waitFor(() =>
      expect(body.queryByRole('listbox')).not.toBeInTheDocument()
    )
    await expect(trigger).toHaveFocus()
    await expect(canvas.getByLabelText('Selected value')).toHaveTextContent(
      'savings'
    )
    await userEvent.click(
      canvas.getByRole('button', { name: 'Clear selection' })
    )
    await expect(trigger).toHaveFocus()
    await expect(canvas.getByLabelText('Selected value')).toHaveTextContent(
      'none'
    )
    await expect(body.queryByRole('listbox')).not.toBeInTheDocument()
    await userEvent.keyboard('{Enter}')
    await body.findByRole('listbox')
    await userEvent.keyboard('cash{Enter}')
    await waitFor(() =>
      expect(canvas.getByLabelText('Selected value')).toHaveTextContent('cash')
    )
    await userEvent.click(trigger)
    await body.findByRole('listbox')
    await userEvent.keyboard('{Escape}')
    await expect(trigger).toHaveFocus()
    await expect(canvas.getByLabelText('Selected value')).toHaveTextContent(
      'cash'
    )
    await userEvent.click(trigger)
    await body.findByRole('listbox')
    await userEvent.tab()
    await waitFor(() =>
      expect(body.queryByRole('listbox')).not.toBeInTheDocument()
    )
    await userEvent.click(trigger)
    await body.findByRole('listbox')
    await userEvent.click(canvas.getByLabelText('Selected value'))
    await waitFor(() =>
      expect(body.queryByRole('listbox')).not.toBeInTheDocument()
    )
  },
}
function Variants() {
  const [value, setValue] = useState<string | null>('two')
  const short = [
    { value: 'one', label: 'Only me' },
    { value: 'two', label: 'Everyone' },
    { value: 'three', label: 'Nobody' },
  ]
  return (
    <div className="grid max-w-3xl gap-6 p-4 sm:grid-cols-2">
      <Select
        label="Visibility"
        items={short}
        value={value}
        onChange={setValue}
        alignSelected
        required
      />
      <Select
        label="Small"
        size="sm"
        items={short}
        value={value}
        onChange={setValue}
      />
      <Select
        label="Read only"
        items={short}
        value={value}
        onChange={setValue}
        readOnly
      />
      <Select
        label="Disabled"
        items={short}
        value={value}
        onChange={setValue}
        disabled
      />
      <Select label="Empty" items={[]} value={null} onChange={setValue} />
      <Select
        label="Long list"
        items={Array.from({ length: 100 }, (_, i) => ({
          value: String(i),
          label: `Account ${String(i + 1).padStart(3, '0')}`,
        }))}
        value={null}
        onChange={() => {}}
      />
      <Select
        label="Add visibility filter"
        items={short}
        value={value}
        onChange={setValue}
        trigger={
          <Button variant="secondary">
            <Plus /> Add filter
          </Button>
        }
      />
    </div>
  )
}
export const Showcase: Story = { render: () => <Variants /> }
function FormDemo() {
  const [value, setValue] = useState<string | null>('cash')
  const [submitted, setSubmitted] = useState('')
  return (
    <form
      className="grid max-w-sm gap-4"
      onSubmit={event => {
        event.preventDefault()
        setSubmitted(String(new FormData(event.currentTarget).get('account')))
      }}
    >
      <Select
        label="Required account"
        name="account"
        required
        items={items}
        value={value}
        onChange={setValue}
      />
      <Select
        label="Read-only account"
        readOnly
        items={items}
        value={value}
        onChange={setValue}
      />
      <Select
        label="Disabled account"
        disabled
        items={items}
        value={value}
        onChange={setValue}
      />
      <Button type="submit">Submit</Button>
      <output aria-label="Submitted value">{submitted}</output>
    </form>
  )
}
export const Form: Story = {
  render: () => <FormDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body)
    await expect(
      canvas.queryByRole('button', { name: 'Clear selection' })
    ).not.toBeInTheDocument()
    await userEvent.click(
      canvas.getByRole('combobox', { name: /Read-only account/ })
    )
    await userEvent.keyboard('{Enter} ')
    await expect(body.queryByRole('listbox')).not.toBeInTheDocument()
    await userEvent.tab()
    await expect(canvas.getByRole('button', { name: 'Submit' })).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect(canvas.getByLabelText('Submitted value')).toHaveTextContent(
      'cash'
    )
  },
}

function EmptyAlignmentDemo() {
  const [value, setValue] = useState<string | null>(null)
  return (
    <div className="mx-auto mt-40 w-80">
      <Select
        label="Visibility"
        alignSelected
        value={value}
        onChange={setValue}
        items={[
          { value: 'one', label: 'Only me' },
          { value: 'two', label: 'Everyone' },
        ]}
      />
    </div>
  )
}

export const EmptyAlignment: Story = {
  render: () => <EmptyAlignmentDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole('combobox')
    const expectBelowTrigger = async () => {
      const option = await body.findByRole('option', { name: 'Only me' })
      await waitFor(() => {
        expect(option.getBoundingClientRect().top).toBeGreaterThanOrEqual(
          trigger.getBoundingClientRect().bottom
        )
      })
    }
    await userEvent.click(trigger)
    await expectBelowTrigger()
    await userEvent.click(body.getByRole('option', { name: 'Everyone' }))
    await userEvent.click(
      canvas.getByRole('button', { name: 'Clear selection' })
    )
    await userEvent.click(trigger)
    await expectBelowTrigger()
    await userEvent.keyboard('{Escape}')
    await expect(trigger).toHaveFocus()
  },
}

function ControlledAlignmentDemo() {
  const [value, setValue] = useState<string | null>('two')
  const popup = usePopup()
  const { setOpen } = popup
  return (
    <div className="mx-auto mt-40 grid w-80 gap-4">
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open from outside
      </Button>
      <Select
        label="Visibility"
        alignSelected
        popup={popup}
        value={value}
        onChange={setValue}
        items={[
          { value: 'one', label: 'Only me' },
          { value: 'two', label: 'Everyone' },
        ]}
      />
    </div>
  )
}

/** Alignment is decided as the panel opens, so it also works when the consumer
 * opens through `usePopup` and Base UI's change handler never runs. */
export const ControlledAlignment: Story = {
  render: () => <ControlledAlignmentDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole('combobox')
    await userEvent.click(
      canvas.getByRole('button', { name: 'Open from outside' })
    )
    const option = await body.findByRole('option', { name: 'Everyone' })
    // Aligned mode lays the selected row over the field; anchored sits below it.
    await waitFor(() =>
      expect(option.getBoundingClientRect().top).toBeLessThan(
        trigger.getBoundingClientRect().bottom
      )
    )
    await userEvent.keyboard('{Escape}')
    await waitFor(() =>
      expect(body.queryByRole('listbox')).not.toBeInTheDocument()
    )
  },
}
