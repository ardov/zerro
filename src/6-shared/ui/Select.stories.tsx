import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { Select } from './Select'

const meta = {
  title: 'Library/Input/Select',
  component: Select,
  tags: ['autodocs'],
  args: {
    className: 'w-[240px]',
    label: 'Visibility',
    onChange: () => {},
    options: [
      { value: 'auto', label: 'Auto' },
      { value: 'visible', label: 'Visible' },
      { value: 'hidden', label: 'Hidden' },
    ],
    value: 'auto',
  },
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

const options = [
  { value: 'auto', label: 'Auto' },
  { value: 'visible', label: 'Visible' },
  { value: 'hidden', label: 'Hidden' },
]

function Harness() {
  const [value, setValue] = useState('auto')
  return (
    <div className="p-[200px]">
      <Select
        label="Visibility"
        value={value}
        onChange={setValue}
        options={options}
        className="w-[240px]"
      />
      <output data-testid="value">{value}</output>
    </div>
  )
}

/** One component instance, entirely controlled by the Args panel. */
export const Bench: Story = {}

export const Showcase: Story = {
  tags: ['!test'],
  render: () => <OutlinedField />,
}

export const Picking: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole('combobox', { name: /Visibility/ })

    // Closed, the trigger reads out the chosen option.
    await expect(trigger).toHaveTextContent('Auto')
    await userEvent.click(trigger)
    const list = await body.findByRole('listbox')

    // Options, not menu items: this is a value picker, not a list of actions.
    await expect(within(list).getAllByRole('option')).toHaveLength(3)
    await userEvent.click(within(list).getByRole('option', { name: /Hidden/ }))
    await waitFor(() =>
      expect(canvas.getByTestId('value')).toHaveTextContent('hidden')
    )
    await waitFor(() => expect(body.queryByRole('listbox')).toBeNull())
    await expect(trigger).toHaveTextContent('Hidden')
    await waitFor(() => expect(trigger).toHaveFocus())
  },
}

/** The currency picker's rows: a code, and the full name under it. */
const currencies = [
  { value: 'USD', label: 'USD', description: 'US Dollar ($)' },
  { value: 'EUR', label: 'EUR', description: 'Euro (€)' },
]

function DescribedHarness() {
  const [value, setValue] = useState('USD')
  return (
    <div className="p-[200px]">
      <Select
        label="Currency"
        value={value}
        onChange={setValue}
        options={currencies}
        className="w-[240px]"
      />
    </div>
  )
}

export const SecondLine: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <DescribedHarness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole('combobox', { name: /Currency/ })

    // The closed field shows the label alone: the second line is the row's.
    await expect(trigger).toHaveTextContent(/^USD$/)
    await userEvent.click(trigger)
    const list = await body.findByRole('listbox')
    await expect(
      within(list).getByRole('option', { name: /EUR/ })
    ).toHaveTextContent('Euro')
  },
}

function OutlinedField() {
  return (
    <div className="p-[200px]">
      <Select
        label="Visibility"
        value="auto"
        onChange={() => {}}
        options={options}
        className="w-[240px]"
      />
    </div>
  )
}
