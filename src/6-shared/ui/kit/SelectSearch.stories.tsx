import { usePopup } from '@/6-shared/overlays'
import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within, waitFor } from 'storybook/test'
import { Plus, Wallet } from 'lucide-react'
import { Select, type SelectItem } from './Select'
import { Button, IconButton } from './Button'

const items: SelectItem[] = [
  {
    type: 'group',
    id: 'bank',
    label: 'Bank accounts',
    items: [
      {
        value: 'daily',
        label: 'Everyday account',
        keywords: ['běžný účet'],
        start: <Wallet />,
        description: 'Daily spending',
        end: 'CZK',
      },
      { value: 'savings', label: 'Savings account', end: 'EUR' },
      { value: 'closed', label: 'Closed account', disabled: true },
    ],
  },
  { type: 'separator', id: 'cash-separator' },
  { value: 'cash', label: 'Cash' },
  { value: 'travel', label: 'Travel cash' },
]
const meta = {
  title: 'UI Kit/Select/Search',
  component: Select,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `Single selection with search inside the popup.

\`<Select search label="Account" items={items} value={value} onChange={setValue} />\`

- Search matches labels and optional **keywords** across the full source. Selection closes the popup; closing resets the query and expansion.
- **search={{ limit: 10 }}** initially limits options. Show more is a separate button in the scrollport, reached with Tab; Shift-Tab returns to search.
- **search.filter(items, query)** returns the final filtered/ranked items, without a second filter. Keep the full source in **items** so the closed value and icon remain available.
- **search.autoFocus=false** focuses the popup without opening a software keyboard; Tab reaches search.
- Localize **search.label**, **search.placeholder**, **search.showMoreLabel**, **emptyText**, and **clearLabel**.
- **search.actions** holds consumer-owned buttons after the list. Pass **popup={usePopup()}** to close after an action.
- Search uses ordinary positioning; **alignSelected** applies only without search. Mobile keyboard behavior needs testing on a real device.
`,
      },
    },
  },
  args: {
    label: 'Account',
    items,
    value: null,
    onChange: () => {},
    search: true,
  },
} satisfies Meta<typeof Select>
export default meta
type Story = StoryObj<typeof meta>

function Demo(props: { autoFocus?: boolean; required?: boolean }) {
  const { autoFocus, required } = props
  const [value, setValue] = useState<string | null>('daily')
  const [submits, setSubmits] = useState(0)
  return (
    <form
      className="grid max-w-sm gap-4"
      onSubmit={event => {
        event.preventDefault()
        setSubmits(count => count + 1)
      }}
    >
      <Select
        label="Account"
        name="account"
        items={items}
        value={value}
        onChange={setValue}
        required={required}
        search={{ limit: 2, autoFocus }}
      />
      <Button variant="secondary">Next control</Button>
      <output aria-label="Selected value">{value ?? 'none'}</output>
      <output aria-label="Submissions">{submits}</output>
    </form>
  )
}
export const Playground: Story = { render: () => <Demo /> }
export const Interaction: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole('combobox', {
      name: /Account Everyday account/,
    })
    await userEvent.click(trigger)
    const search = await body.findByRole('combobox', { name: 'Search Account' })
    await expect(search).toHaveFocus()
    await expect(body.getAllByRole('option')).toHaveLength(2)
    await userEvent.type(search, 'Travel cash')
    await expect(
      body.getByRole('option', { name: 'Travel cash' })
    ).toBeVisible()
    await expect(body.queryByRole('group')).not.toBeInTheDocument()
    await userEvent.keyboard('{ArrowDown}{Enter}')
    await waitFor(() =>
      expect(body.queryByRole('listbox')).not.toBeInTheDocument()
    )
    await expect(trigger).toHaveFocus()
    await expect(canvas.getByLabelText('Selected value')).toHaveTextContent(
      'travel'
    )
    await expect(canvas.getByLabelText('Submissions')).toHaveTextContent('0')
    await expect(
      new FormData(canvasElement.querySelector('form')!).get('account')
    ).toBe('travel')
    await userEvent.click(trigger)
    const reopened = await body.findByRole('combobox', {
      name: 'Search Account',
    })
    await expect(reopened).toHaveValue('')
    await userEvent.type(reopened, 'bezny ucet')
    await expect(body.getAllByRole('option')).toHaveLength(1)
    await expect(
      body.getByRole('option', { name: /Everyday account/ })
    ).toBeVisible()
    await userEvent.clear(reopened)
    await userEvent.type(reopened, 'nothing matches')
    await expect(body.getByText('No options')).toHaveTextContent('No options')
    await expect(canvas.getByLabelText('Selected value')).toHaveTextContent(
      'travel'
    )
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(trigger).toHaveFocus())
    await userEvent.click(
      canvas.getByRole('button', { name: 'Clear selection' })
    )
    await expect(canvas.getByLabelText('Selected value')).toHaveTextContent(
      'none'
    )
    await expect(body.queryByRole('listbox')).not.toBeInTheDocument()
    await expect(trigger).toHaveFocus()
  },
}
export const Expansion: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole('combobox', {
      name: /Account Everyday account/,
    })
    await userEvent.click(trigger)
    const search = await body.findByRole('combobox', { name: 'Search Account' })
    await userEvent.tab()
    const more = body.getByRole('button', { name: 'Show more' })
    await expect(more).toHaveFocus()
    await expect(body.getByRole('listbox')).not.toContainElement(more)
    await userEvent.tab({ shift: true })
    await expect(search).toHaveFocus()
    await userEvent.tab()
    await userEvent.keyboard('{Enter}')
    await expect(search).toHaveFocus()
    await expect(body.getAllByRole('option')).toHaveLength(5)
    await expect(canvas.getByLabelText('Selected value')).toHaveTextContent(
      'daily'
    )
    await expect(canvas.getByLabelText('Submissions')).toHaveTextContent('0')
    await userEvent.click(body.getByRole('option', { name: 'Closed account' }))
    await expect(canvas.getByLabelText('Selected value')).toHaveTextContent(
      'daily'
    )
    await expect(body.getByRole('listbox')).toBeVisible()
    await userEvent.click(search)
    await userEvent.tab()
    await waitFor(() =>
      expect(body.queryByRole('listbox')).not.toBeInTheDocument()
    )
    await expect(
      canvas.getByRole('button', { name: 'Next control' })
    ).toHaveFocus()
  },
}
export const WithoutAutofocus: Story = {
  render: () => <Demo autoFocus={false} required />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body)
    await expect(
      canvas.queryByRole('button', { name: 'Clear selection' })
    ).not.toBeInTheDocument()
    await userEvent.click(
      canvas.getByRole('combobox', { name: /Account Everyday account/ })
    )
    const search = await body.findByRole('combobox', { name: 'Search Account' })
    await expect(search).not.toHaveFocus()
    await userEvent.tab()
    await expect(search).toHaveFocus()
    await userEvent.keyboard('{Escape}')
  },
}
function CategoryDemo() {
  const [selected, setSelected] = useState<string[]>([])
  return (
    <div className="flex items-center gap-3">
      <span>{selected.join(', ') || 'No categories'}</span>
      <Select
        label="Category"
        value={null}
        onChange={value => {
          if (value) setSelected(current => [...current, value])
        }}
        items={[
          { value: 'Food', label: 'Food' },
          { value: 'Travel', label: 'Travel' },
        ].filter(item => !selected.includes(item.value))}
        search
        trigger={
          <IconButton label="Add category" tooltip={false}>
            <Plus />
          </IconButton>
        }
      />
    </div>
  )
}
export const AddCategory: Story = {
  render: () => <CategoryDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole('combobox', { name: 'Add category' })
    await userEvent.click(trigger)
    await userEvent.type(
      await body.findByRole('combobox', { name: 'Search Category' }),
      'Food'
    )
    await userEvent.keyboard('{ArrowDown}{Enter}')
    await waitFor(() =>
      expect(body.queryByRole('listbox')).not.toBeInTheDocument()
    )
    await expect(canvas.getByText('Food')).toBeVisible()
    await expect(trigger).toHaveFocus()
  },
}
function RankedDemo() {
  const [value, setValue] = useState<string | null>('daily')
  return (
    <Select
      label="Merchant"
      items={items}
      value={value}
      onChange={setValue}
      search={{
        filter: (source, query) =>
          query
            ? [
                { value: 'cash', label: 'Cash' },
                { value: 'daily', label: 'Everyday account' },
              ]
            : source,
      }}
    />
  )
}
export const ExternalRanking: Story = {
  render: () => <RankedDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      canvas.getByRole('combobox', { name: /Merchant Everyday account/ })
    )
    await userEvent.type(
      await body.findByRole('combobox', { name: 'Search Merchant' }),
      'custom ranking'
    )
    const options = body.getAllByRole('option')
    await expect(options).toHaveLength(2)
    await expect(options[0]).toHaveTextContent('Cash')
    await expect(options[1]).toHaveTextContent('Everyday account')
    await userEvent.keyboard('{Escape}')
  },
}
export const Showcase: Story = {
  render: () => (
    <div className="grid max-w-sm gap-4">
      <Select
        search
        label="Account"
        items={items}
        value="daily"
        onChange={() => {}}
        labelMode="floating"
      />
      <Select
        search
        label="Small"
        size="sm"
        items={items}
        value={null}
        onChange={() => {}}
      />
      <Select
        search
        label="Invalid"
        error="Choose an account"
        items={items}
        value={null}
        onChange={() => {}}
      />
      <Select
        search
        label="Read only"
        readOnly
        items={items}
        value="daily"
        onChange={() => {}}
      />
      <Select
        search
        label="Disabled"
        disabled
        items={items}
        value="daily"
        onChange={() => {}}
      />
    </div>
  ),
}

function ActionDemo() {
  const popup = usePopup()
  const [, setOpen] = popup
  const [created, setCreated] = useState(false)
  return (
    <div className="grid max-w-sm gap-4">
      <Select
        label="Merchant"
        items={items}
        value="daily"
        onChange={() => {}}
        popup={popup}
        search={{
          actions: (
            <Button
              variant="ghost"
              onClick={() => {
                setCreated(true)
                setOpen(false)
              }}
            >
              Create merchant
            </Button>
          ),
        }}
      />
      <Button variant="secondary">Next control</Button>
      {created && <output>Merchant created</output>}
    </div>
  )
}
export const ConsumerAction: Story = {
  render: () => <ActionDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole('combobox', {
      name: /Merchant Everyday account/,
    })
    await userEvent.click(trigger)
    const search = await body.findByRole('combobox', {
      name: 'Search Merchant',
    })
    await userEvent.type(search, 'nothing matches')
    await userEvent.tab()
    const action = body.getByRole('button', { name: 'Create merchant' })
    await expect(action).toHaveFocus()
    await expect(body.getByRole('listbox')).not.toContainElement(action)
    await userEvent.keyboard('{Enter}')
    await waitFor(() =>
      expect(body.queryByRole('listbox')).not.toBeInTheDocument()
    )
    await expect(canvas.getByText('Merchant created')).toBeVisible()
    await expect(trigger).toHaveFocus()
    await userEvent.click(trigger)
    await expect(
      await body.findByRole('combobox', { name: 'Search Merchant' })
    ).toHaveValue('')
    await userEvent.click(canvas.getByRole('button', { name: 'Next control' }))
    await waitFor(() =>
      expect(body.queryByRole('listbox')).not.toBeInTheDocument()
    )
  },
}
export const ExpansionExit: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      canvas.getByRole('combobox', { name: /Account Everyday account/ })
    )
    const search = await body.findByRole('combobox', { name: 'Search Account' })
    await waitFor(() => expect(search).toHaveFocus())
    await userEvent.tab()
    await expect(body.getByRole('button', { name: 'Show more' })).toHaveFocus()
    await userEvent.tab()
    await waitFor(() =>
      expect(body.queryByRole('listbox')).not.toBeInTheDocument()
    )
    await expect(
      canvas.getByRole('button', { name: 'Next control' })
    ).toHaveFocus()
  },
}
export const LongList: Story = {
  args: {
    items: Array.from({ length: 100 }, (_, index) => ({
      value: String(index),
      label: `Account ${String(index + 1).padStart(3, '0')}`,
      description: 'A longer explanation which can wrap onto a second line.',
      start: index % 3 ? undefined : <Wallet />,
    })),
    search: true,
  },
}
