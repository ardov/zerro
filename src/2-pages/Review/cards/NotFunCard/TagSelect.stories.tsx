import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { TagSelect } from './TagSelect'

const options = [
  { id: 'food', name: 'Food', amount: 120 },
  { id: 'travel', name: 'Travel', amount: 240 },
  { id: 'hidden', name: 'No spending', amount: 0 },
]

function Demo({ initial = [] }: { initial?: string[] }) {
  const [selected, setSelected] = useState(initial)
  return (
    <>
      <TagSelect
        label="Categories"
        options={options}
        selected={selected}
        onChange={setSelected}
      />
      <output aria-label="Selected IDs">{selected.join(',') || 'none'}</output>
    </>
  )
}

const meta = {
  title: 'App/Review/TagSelect',
  component: TagSelect,
  parameters: { layout: 'centered' },
  args: { options, selected: [], onChange: () => {}, label: 'Categories' },
  render: () => <Demo />,
} satisfies Meta<typeof TagSelect>
export default meta
type Story = StoryObj<typeof meta>

export const Selection: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole('combobox', { name: /Categories/ })
    await expect(trigger).toHaveTextContent('Nothing Selected')
    await userEvent.click(trigger)
    const list = await body.findByRole('listbox')
    const food = within(list).getByRole('option', { name: /Food/ })
    const travel = within(list).getByRole('option', { name: /Travel/ })
    await expect(
      within(list).queryByRole('option', { name: /No spending/ })
    ).toBeNull()
    await userEvent.click(food)
    await expect(trigger).toHaveTextContent('Food')
    await expect(trigger).not.toHaveTextContent('120')
    await expect(list).toBeVisible()
    await userEvent.click(travel)
    await expect(trigger).toHaveTextContent('2 categories')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(trigger).toHaveFocus())
    await expect(canvas.getByLabelText('Selected IDs')).toHaveTextContent(
      'food,travel'
    )
    await userEvent.click(trigger)
    const reopened = await body.findByRole('listbox')
    await userEvent.click(
      within(reopened).getByRole('option', { name: /Travel/ })
    )
    await userEvent.click(
      within(reopened).getByRole('option', { name: /Food/ })
    )
    await expect(trigger).toHaveTextContent('Nothing Selected')
    await expect(canvas.getByLabelText('Selected IDs')).toHaveTextContent(
      'none'
    )
    await userEvent.keyboard('{Escape}')
  },
}

export const HiddenSelection: Story = {
  render: () => <Demo initial={['hidden']} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole('combobox', { name: /Categories/ })
    await expect(trigger).toHaveTextContent('No spending')
    await userEvent.click(trigger)
    const list = await body.findByRole('listbox')
    await userEvent.click(within(list).getByRole('option', { name: /Food/ }))
    await expect(canvas.getByLabelText('Selected IDs')).toHaveTextContent(
      'hidden,food'
    )
    await expect(trigger).toHaveTextContent('2 categories')
    await userEvent.keyboard('{Escape}')
  },
}
