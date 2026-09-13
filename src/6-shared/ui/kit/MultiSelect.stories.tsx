import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within, waitFor } from 'storybook/test'
import { Wallet } from 'lucide-react'
import { MultiSelect } from './MultiSelect'
import { Button } from './Button'
import type { SelectItem } from './Select'

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
        end: 'CZK',
      },
      { value: 'savings', label: 'Savings account', end: 'EUR' },
      { value: 'closed', label: 'Closed account', disabled: true },
    ],
  },
  { type: 'separator', id: 'cash-separator' },
  { value: 'cash', label: 'Cash', keywords: ['notes'] },
]
const meta = {
  title: 'UI Kit/MultiSelect',
  component: MultiSelect,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `Immediate multiple selection, with optional search.

\`<MultiSelect label="Accounts" items={items} value={value} onChange={setValue} />\`

- Each toggle updates the controlled array and keeps the panel open. Escape, Tab and outside clicks keep changes.
- An empty array shows the placeholder; one value shows its name and icon; several values show **Selected: N**. Localize with **selectionLabel(count)** or customize with **renderValue(items)**.
- **required** prevents removing the last selection. An initially empty field remains possible for form validation.
- **search** enables the same filtering, limit and actions as Select. Toggling keeps the query; closing resets it. Hidden selected values stay selected.
- Selected rows use the shared background and ARIA state, without checkboxes or chips. Selected-row alignment is available only on single Select.
`,
      },
    },
  },
  args: { label: 'Accounts', items, value: [], onChange: () => {} },
} satisfies Meta<typeof MultiSelect>
export default meta
type Story = StoryObj<typeof meta>

function Demo(props: {
  search?: boolean
  required?: boolean
  custom?: boolean
  initial?: string[]
}) {
  const { search, required, custom, initial = ['daily'] } = props
  const [value, setValue] = useState(initial)
  const [submitted, setSubmitted] = useState('none')
  return (
    <form
      className="grid max-w-sm gap-4"
      onSubmit={event => {
        event.preventDefault()
        setSubmitted(
          new FormData(event.currentTarget).getAll('accounts').join(',')
        )
      }}
    >
      <MultiSelect
        label="Accounts"
        name="accounts"
        items={items}
        value={value}
        onChange={setValue}
        search={search ? { limit: 2 } : false}
        required={required}
        selectionLabel={count => `${count} accounts selected`}
        trigger={custom ? <Button>Choose accounts</Button> : undefined}
      />
      <Button type="button">Next control</Button>
      <Button type="submit">Submit</Button>
      <output aria-label="Selection">{value.join(',') || 'none'}</output>
      <output aria-label="Submitted">{submitted}</output>
    </form>
  )
}
export const Playground: Story = { render: () => <Demo /> }
export const Search: Story = { render: () => <Demo search /> }
export const Interaction: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole('combobox', {
      name: /Accounts Everyday account/,
    })
    await userEvent.click(trigger)
    const list = await body.findByRole('listbox')
    await expect(list).toHaveAttribute('aria-multiselectable', 'true')
    await userEvent.click(
      body.getByRole('option', { name: 'Savings account EUR' })
    )
    await expect(list).toBeVisible()
    await expect(canvas.getByLabelText('Selection')).toHaveTextContent(
      'daily,savings'
    )
    await expect(
      body.getByRole('option', { name: 'Savings account EUR' })
    ).toHaveAttribute('aria-selected', 'true')
    await expect(
      body.getByRole('option', { name: 'Closed account' })
    ).toHaveAttribute('aria-disabled', 'true')
    await userEvent.keyboard(' ')
    await expect(canvas.getByLabelText('Selection')).toHaveTextContent(
      /^daily$/
    )
    await userEvent.keyboard('{Enter}')
    await expect(canvas.getByLabelText('Selection')).toHaveTextContent(
      'daily,savings'
    )
    await expect(canvas.getByLabelText('Submitted')).toHaveTextContent('none')
    await userEvent.keyboard('{Escape}')
    await waitFor(() =>
      expect(body.queryByRole('listbox')).not.toBeInTheDocument()
    )
    await expect(trigger).toHaveFocus()
    await expect(trigger).toHaveTextContent('2 accounts selected')
    await userEvent.click(canvas.getByRole('button', { name: 'Submit' }))
    await expect(canvas.getByLabelText('Submitted')).toHaveTextContent(
      'daily,savings'
    )
    await userEvent.click(
      canvas.getByRole('button', { name: 'Clear selection' })
    )
    await expect(canvas.getByLabelText('Selection')).toHaveTextContent('none')
    await expect(trigger).toHaveFocus()
    await expect(body.queryByRole('listbox')).not.toBeInTheDocument()
  },
}
export const SearchInteraction: Story = {
  render: () => <Demo search />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole('combobox', {
      name: /Accounts Everyday account/,
    })
    await userEvent.click(trigger)
    const input = await body.findByRole('combobox', { name: 'Search Accounts' })
    await userEvent.type(input, 'notes')
    await userEvent.keyboard('{ArrowDown}{Enter}')
    await expect(input).toHaveValue('notes')
    await expect(input).toHaveFocus()
    await expect(canvas.getByLabelText('Selection')).toHaveTextContent(
      'daily,cash'
    )
    await expect(body.getByRole('option', { name: 'Cash' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    await expect(canvas.getByLabelText('Submitted')).toHaveTextContent('none')
    await userEvent.keyboard('{Enter}')
    await expect(canvas.getByLabelText('Selection')).toHaveTextContent(
      /^daily$/
    )
    await userEvent.keyboard('{Enter}')
    await userEvent.clear(input)
    await userEvent.click(body.getByRole('button', { name: 'Show more' }))
    await expect(input).toHaveFocus()
    await expect(body.getByRole('option', { name: 'Cash' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    await userEvent.keyboard('{Escape}')
    await waitFor(() =>
      expect(body.queryByRole('listbox')).not.toBeInTheDocument()
    )
    await expect(trigger).toHaveFocus()
    await userEvent.click(trigger)
    await expect(
      await body.findByRole('combobox', { name: 'Search Accounts' })
    ).toHaveValue('')
    await expect(body.getAllByRole('option')).toHaveLength(2)
    await userEvent.click(canvas.getByRole('button', { name: 'Next control' }))
    await waitFor(() =>
      expect(body.queryByRole('listbox')).not.toBeInTheDocument()
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Submit' }))
    await expect(canvas.getByLabelText('Submitted')).toHaveTextContent(
      'daily,cash'
    )
  },
}
export const Required: Story = {
  render: () => <Demo required />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body)
    await expect(
      canvas.queryByRole('button', { name: 'Clear selection' })
    ).not.toBeInTheDocument()
    await userEvent.click(canvas.getByRole('combobox'))
    await userEvent.click(
      await body.findByRole('option', { name: 'Everyday account CZK' })
    )
    await expect(canvas.getByLabelText('Selection')).toHaveTextContent(
      /^daily$/
    )
    await userEvent.click(
      body.getByRole('option', { name: 'Savings account EUR' })
    )
    await userEvent.click(
      body.getByRole('option', { name: 'Everyday account CZK' })
    )
    await expect(canvas.getByLabelText('Selection')).toHaveTextContent(
      /^savings$/
    )
    await userEvent.keyboard('{Escape}')
  },
}
export const SearchRequired: Story = {
  ...Required,
  render: () => <Demo required search />,
}
export const CustomTrigger: Story = {
  render: () => <Demo custom />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole('combobox', { name: 'Choose accounts' })
    await userEvent.click(trigger)
    await userEvent.click(await body.findByRole('option', { name: 'Cash' }))
    await userEvent.keyboard('{Tab}')
    await waitFor(() =>
      expect(body.queryByRole('listbox')).not.toBeInTheDocument()
    )
    await expect(canvas.getByLabelText('Selection')).toHaveTextContent(
      'daily,cash'
    )
    await expect(
      canvas.getByRole('button', { name: 'Next control' })
    ).toHaveFocus()
  },
}
export const SearchCustomTrigger: Story = {
  render: () => <Demo custom search />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole('combobox', { name: 'Choose accounts' })
    await userEvent.click(trigger)
    const input = await body.findByRole('combobox', { name: 'Search Accounts' })
    await userEvent.type(input, 'notes')
    await userEvent.keyboard('{ArrowDown}{Enter}{Escape}')
    await waitFor(() =>
      expect(body.queryByRole('listbox')).not.toBeInTheDocument()
    )
    await expect(trigger).toHaveFocus()
    await expect(canvas.getByLabelText('Selection')).toHaveTextContent(
      'daily,cash'
    )
    await expect(trigger).toHaveTextContent('Choose accounts')
  },
}
export const Showcase: Story = {
  render: () => (
    <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
      <MultiSelect
        label="Empty"
        items={items}
        value={[]}
        onChange={() => {}}
        placeholder="Choose accounts"
      />
      <MultiSelect
        label="One account"
        items={items}
        value={['daily']}
        onChange={() => {}}
      />
      <MultiSelect
        label="Accounts"
        labelMode="floating"
        items={items}
        value={['daily', 'cash']}
        onChange={() => {}}
      />
      <MultiSelect
        label="Small"
        size="sm"
        items={items}
        value={['cash']}
        onChange={() => {}}
      />
      <MultiSelect
        label="Read only"
        readOnly
        items={items}
        value={['daily', 'cash']}
        onChange={() => {}}
      />
      <MultiSelect
        label="Disabled"
        disabled
        items={items}
        value={['daily']}
        onChange={() => {}}
      />
      <MultiSelect
        label="Invalid"
        error="Choose at least one account"
        items={items}
        value={[]}
        onChange={() => {}}
      />
      <MultiSelect
        label="Custom value"
        items={items}
        value={['daily', 'cash']}
        onChange={() => {}}
        renderValue={selected => selected.map(item => item.label).join(', ')}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body)
    await expect(
      canvas.getByRole('combobox', { name: /Disabled/ })
    ).toBeDisabled()
    const readOnly = canvas.getByRole('combobox', { name: /Read only/ })
    await userEvent.click(readOnly)
    await expect(readOnly).toHaveFocus()
    await expect(body.queryByRole('listbox')).not.toBeInTheDocument()
  },
}
