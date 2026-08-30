import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { MultiSelect } from './Select'

const options = [
  { value: 'auto', label: 'Auto' },
  { value: 'visible', label: 'Visible' },
  { value: 'hidden', label: 'Hidden' },
]

const meta = {
  title: 'Library/Input/MultiSelect',
  component: MultiSelect,
  tags: ['autodocs'],
  args: {
    className: 'w-[240px]',
    label: 'Tags',
    onChange: () => {},
    options,
    renderValue: value => `${value.length} selected`,
    value: [],
  },
} satisfies Meta<typeof MultiSelect>

export default meta
type Story = StoryObj<typeof meta>

/** One component instance, entirely controlled by the Args panel. */
export const Bench: Story = {}

export const Showcase: Story = {
  tags: ['!test'],
  args: { value: ['auto', 'hidden'] },
}

function Harness() {
  const [value, setValue] = useState<string[]>([])
  return (
    <div className="p-[200px]">
      <MultiSelect
        label="Tags"
        value={value}
        onChange={setValue}
        options={options}
        renderValue={next => `${next.length} selected`}
        className="w-[240px]"
      />
      <output data-testid="value">{value.join(',')}</output>
    </div>
  )
}

export const MultipleValues: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole('combobox', { name: /Tags/ })
    await userEvent.click(trigger)
    const list = await body.findByRole('listbox')

    // Picking does not close a multiple select, so a second value can follow.
    await userEvent.click(within(list).getByRole('option', { name: 'Auto' }))
    await userEvent.click(within(list).getByRole('option', { name: 'Hidden' }))
    await waitFor(() =>
      expect(canvas.getByTestId('value')).toHaveTextContent('auto,hidden')
    )
    await expect(trigger).toHaveTextContent('2 selected')
  },
}
