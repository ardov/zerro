import { usePopup } from '@/6-shared/overlays'
import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fireEvent, userEvent, within, waitFor } from 'storybook/test'
import { Wallet, Landmark, Plus } from 'lucide-react'
import { Select, type SelectItem } from './Select'
import { Button } from './Button'
import { Dialog } from './Dialog'

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
  title: 'UI Kit/Inputs/Select',
  component: Select,
  tags: ['autodocs'],
  parameters: {
    controls: { disable: true },
    layout: 'padded',
    docs: {
      description: {
        component: `Single selection with keyboard navigation, grouped options and optional images.

\`<Select label="Account" items={items} value={value} onChange={setValue} />\`

- Use stable string values; **null** means empty. Options have a string **label**, optional **start**, **description**, **end**, and **disabled**.
- Groups use **{ type: 'group', id, label, items }**; dividers use **{ type: 'separator', id }**. Groups are flat.
- Disabled rows remain keyboard-focusable but cannot be selected.
- The whole field opens the modal popup. Its transparent backdrop consumes the first outside click; Escape closes it.
- **required** prevents clearing. **readOnly** keeps the field focusable; **name** includes its value in form submission.
- **alignSelected** opts into Base UI text alignment for short lists. Touch and constrained space can fall back to ordinary positioning; native overlap closes on window resize.
- Popup width follows its content, with a minimum of the trigger width plus side insets. **popupMinWidth** sets an additional minimum (pixels or a CSS length); available screen space caps both.
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
    await waitFor(() => expect(trigger).toHaveFocus())
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

export const PopupWidth: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-4">
      {[
        { label: 'Compact', trigger: <Button>2026</Button> },
        {
          label: 'Wide trigger',
          trigger: <Button className="w-64">2026</Button>,
        },
        {
          label: 'Minimum',
          popupMinWidth: 360,
          trigger: <Button>2026</Button>,
        },
        {
          label: 'Search minimum',
          search: true,
          popupMinWidth: '24rem',
          trigger: <Button>2026</Button>,
        },
        {
          label: 'Viewport limit',
          popupMinWidth: '200vw',
          trigger: <Button>2026</Button>,
        },
        { label: 'Field', className: 'w-48' },
        {
          label: 'Long content',
          trigger: <Button>2026</Button>,
          items: [
            {
              value: '2026',
              label: 'A longer option that determines the popup width',
            },
          ],
        },
      ].map(example => (
        <Select
          key={example.label}
          value="2026"
          onChange={() => {}}
          items={[{ value: '2026', label: '2026' }]}
          {...example}
        />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    for (const [index, label] of [
      'Compact',
      'Wide trigger',
      'Minimum',
      'Search minimum',
      'Viewport limit',
      'Field',
      'Long content',
    ].entries()) {
      const trigger = canvas.getAllByRole('combobox')[index]
      await userEvent.click(trigger)
      const list = await body.findByRole('listbox', { name: label })
      await waitFor(() => {
        const rect = (
          list.closest('[role="dialog"]') ?? list
        ).getBoundingClientRect()
        const anchor = trigger.getBoundingClientRect()
        const viewport = canvasElement.ownerDocument.documentElement.clientWidth
        expect(rect.width).toBeGreaterThanOrEqual(
          Math.min(anchor.width + 8, viewport - 32) - 1
        )
        expect(rect.left).toBeGreaterThanOrEqual(15)
        expect(rect.right).toBeLessThanOrEqual(viewport - 15)
        if (label === 'Compact') expect(rect.width).toBeLessThan(200)
        if (label === 'Minimum')
          expect(rect.width).toBeGreaterThanOrEqual(
            Math.min(360, viewport - 32) - 1
          )
        if (label === 'Search minimum')
          expect(rect.width).toBeGreaterThanOrEqual(
            Math.min(384, viewport - 32) - 1
          )
        if (label === 'Long content')
          expect(rect.width).toBeGreaterThan(anchor.width + 40)
      })
      await userEvent.click(within(list).getByRole('option'))
      await waitFor(() =>
        expect(
          body.queryByRole('listbox', { name: label })
        ).not.toBeInTheDocument()
      )
    }
  },
}

function OverlappingList() {
  const [value, setValue] = useState<string | null>('30')
  return (
    <div className="px-10 py-32">
      <Select
        label="Overlapping list"
        alignSelected
        required
        value={value}
        onChange={setValue}
        items={Array.from({ length: 80 }, (_, index) => ({
          value: String(index),
          label: `Option ${index}`,
        }))}
      />
    </div>
  )
}

/** A slow release of the opening press must not select the row under the pointer. */
export const OpeningPressDoesNotSelect: Story = {
  render: () => <OverlappingList />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole('combobox')
    for (let opening = 0; opening < 2; opening++) {
      fireEvent.pointerDown(trigger, {
        pointerType: 'mouse',
        button: 0,
        isPrimary: true,
      })
      fireEvent.mouseDown(trigger, { button: 0 })
      const list = await body.findByRole('listbox')
      const selected = within(list).getByRole('option', { name: 'Option 30' })
      // Base UI enables mouseup selection after 400ms, even without a new press.
      await new Promise(resolve => setTimeout(resolve, 450))
      fireEvent.pointerEnter(selected, { pointerType: 'mouse' })
      fireEvent.mouseUp(selected, { button: 0 })
      await expect(list).toBeInTheDocument()
      await expect(trigger).toHaveAttribute('aria-expanded', 'true')
      await userEvent.click(selected)
      await waitFor(() => expect(body.queryByRole('listbox')).toBeNull())
    }
    await userEvent.click(trigger)
    await userEvent.click(
      await body.findByRole('option', { name: 'Option 31' })
    )
    await waitFor(() =>
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
    )
    await expect(trigger).toHaveTextContent('Option 31')
  },
}

function ModalFieldDemo() {
  const [clicks, setClicks] = useState(0)
  return (
    <div className="grid max-w-sm gap-4">
      {[false, true].map(search => (
        <Select
          key={String(search)}
          label={search ? 'Search account' : 'Plain account'}
          labelMode={search ? 'floating' : 'hidden'}
          search={search}
          items={items}
          value="daily"
          required
          onChange={() => {}}
        />
      ))}
      <Button
        className="fixed top-4 right-4"
        onClick={() => setClicks(count => count + 1)}
      >
        Outside action
      </Button>
      <output aria-label="Outside clicks">{clicks}</output>
    </div>
  )
}

export const WholeFieldAndModalDismissal: Story = {
  render: () => <ModalFieldDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const document = canvasElement.ownerDocument
    const body = within(document.body)
    const outside = canvas.getByRole('button', { name: 'Outside action' })
    let clicks = 0
    for (const trigger of canvas.getAllByRole('combobox')) {
      const field = trigger.closest('.group\\/select-field')!
      const bounds = field.getBoundingClientRect()
      // Real hit testing covers the leading icon, blank padding, and chevron.
      for (const x of [bounds.left + 26, bounds.left + 5, bounds.right - 26]) {
        const hit = document.elementFromPoint(
          x,
          bounds.top + bounds.height / 2
        )!
        await expect(hit.closest('button')).toBe(trigger)
        await userEvent.click(hit)
        await body.findByRole('listbox')
        const target = outside.getBoundingClientRect()
        const outsideHit = document.elementFromPoint(
          target.left + target.width / 2,
          target.top + target.height / 2
        )!
        await expect(outsideHit.closest('button')).not.toBe(outside)
        await userEvent.click(outsideHit)
        await waitFor(() => expect(body.queryByRole('listbox')).toBeNull())
        await expect(canvas.getByLabelText('Outside clicks')).toHaveTextContent(
          String(clicks)
        )
        await waitFor(() =>
          expect(
            document
              .elementFromPoint(
                target.left + target.width / 2,
                target.top + target.height / 2
              )
              ?.closest('button')
          ).toBe(outside)
        )
        await userEvent.click(outside)
        clicks += 1
        await expect(canvas.getByLabelText('Outside clicks')).toHaveTextContent(
          String(clicks)
        )
      }
    }
  },
}

export const NestedModalDismissal: Story = {
  render: () => (
    <Dialog title="Editor" trigger={<Button>Open editor</Button>}>
      <div className="grid gap-4">
        {[false, true].map(search => (
          <Select
            key={String(search)}
            search={search}
            label={search ? 'Search account' : 'Plain account'}
            items={items}
            value="daily"
            onChange={() => {}}
          />
        ))}
      </div>
    </Dialog>
  ),
  play: async ({ canvasElement }) => {
    const document = canvasElement.ownerDocument
    const body = within(document.body)
    for (const name of [/Plain account/, /Search account/]) {
      await userEvent.click(
        within(canvasElement).getByRole('button', { name: 'Open editor' })
      )
      const editor = await body.findByRole('dialog', { name: 'Editor' })
      await userEvent.click(within(editor).getByRole('combobox', { name }))
      await body.findByRole('listbox')
      await userEvent.click(document.elementFromPoint(5, 5)!)
      await waitFor(() => expect(body.queryByRole('listbox')).toBeNull())
      await expect(editor).toBeVisible()
      await userEvent.click(document.elementFromPoint(5, 5)!)
      await waitFor(() =>
        expect(body.queryByRole('dialog', { name: 'Editor' })).toBeNull()
      )
    }
  },
}
