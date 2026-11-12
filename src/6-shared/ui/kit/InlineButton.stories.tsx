import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { InlineButton } from './InlineButton'

const meta = {
  title: 'UI Kit/Building blocks/InlineButton',
  component: InlineButton,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { value: 'categories' },
  render: args => (
    <p className="m-0 text-body text-ui-primary">
      Expenses by <InlineButton {...args} />
    </p>
  ),
} satisfies Meta<typeof InlineButton>
export default meta
type Story = StoryObj<typeof meta>

export const Bench: Story = {}

const values = ['categories', 'places', 'accounts']

/** The sentence keeps its line while the words inside it change. */
export const Cycle: Story = {
  render: () => {
    const [index, setIndex] = useState(0)
    return (
      <p className="m-0 text-body text-ui-primary">
        Expenses by{' '}
        <InlineButton
          value={values[index]}
          onClick={() => setIndex((index + 1) % values.length)}
        />{' '}
        this year
      </p>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'categories' }))
    await userEvent.click(canvas.getByRole('button', { name: 'places' }))
    expect(canvas.getByRole('button', { name: 'accounts' })).toBeVisible()
  },
}
