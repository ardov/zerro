import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useArgs } from 'storybook/preview-api'
import { expect, userEvent, within } from 'storybook/test'
import { InlineField } from './InlineField'

const meta = {
  title: 'UI Kit/Inputs/Inline field',
  component: InlineField,
  tags: ['autodocs'],
  args: { label: 'Category', value: 'Groceries' },
  parameters: {
    docs: {
      description: {
        component:
          'A controlled text input for headings and table cells. Inherits typography and grows up to the available width. No field background, error message or description is rendered. The caller owns saving, cancellation and error feedback; use invalid and aria-describedby when needed. className and style apply to the wrapper. The ref points to the input.',
      },
    },
  },
  decorators: [
    Story => (
      <div className="w-full max-w-xl p-6 text-ui-primary">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof InlineField>
export default meta
type Story = StoryObj<typeof meta>

export const Bench: Story = {
  render: function Bench(args) {
    const [, updateArgs] = useArgs()
    return (
      <InlineField
        {...args}
        onChange={event => updateArgs({ value: event.target.value })}
      />
    )
  },
}

export const Showcase: Story = {
  tags: ['!test'],
  render: () => (
    <div className="grid gap-6">
      <InlineField
        label="Heading"
        value="September budget"
        readOnly
        className="text-4xl font-semibold"
      />
      <InlineField label="Category" value="Groceries" readOnly />
      <InlineField label="Unavailable category" value="Travel" disabled />
      <InlineField
        label="Empty category"
        value=""
        placeholder="Category name"
        readOnly
      />
    </div>
  ),
}

function Examples() {
  const [title, setTitle] = useState('September budget')
  const [category, setCategory] = useState('Groceries')
  return (
    <div className="grid gap-6">
      <h2 className="m-0 text-4xl font-semibold">
        <InlineField
          label="Budget title"
          value={title}
          onChange={event => setTitle(event.target.value)}
        />
      </h2>
      <table className="w-full table-fixed text-left">
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Budget</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <InlineField
                label="Category name"
                value={category}
                onChange={event => setCategory(event.target.value)}
              />
            </td>
            <td>2 500 CZK</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export const InContext: Story = { render: () => <Examples /> }

export const Editing: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Examples />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const title = canvas.getByRole<HTMLInputElement>('textbox', {
      name: 'Budget title',
    })
    const heading = title.closest('h2')!
    await userEvent.tab()
    await expect(title).toHaveFocus()
    await expect(getComputedStyle(title).fontSize).toBe(
      getComputedStyle(heading).fontSize
    )
    await expect(getComputedStyle(title).fontWeight).toBe(
      getComputedStyle(heading).fontWeight
    )
    const category = canvas.getByRole<HTMLInputElement>('textbox', {
      name: 'Category name',
    })
    await userEvent.clear(category)
    await userEvent.type(category, 'Food')
    const shortWidth = category.getBoundingClientRect().width
    await userEvent.type(
      category,
      ' and groceries for the whole family every week'
    )
    await expect(category.getBoundingClientRect().width).toBeGreaterThan(
      shortWidth
    )
    await expect(category.getBoundingClientRect().right).toBeLessThanOrEqual(
      category.closest('td')!.getBoundingClientRect().right + 1
    )
    await expect(category).toHaveValue(
      'Food and groceries for the whole family every week'
    )
  },
}
