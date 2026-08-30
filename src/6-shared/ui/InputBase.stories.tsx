import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { InputBase } from './InputBase'

const meta = {
  title: 'Library/Input/InputBase',
  component: InputBase,
  tags: ['autodocs'],
  args: { className: 'w-[280px]', placeholder: 'Search' },
} satisfies Meta<typeof InputBase>

export default meta
type Story = StoryObj<typeof meta>

/** One component instance, entirely controlled by the Args panel. */
export const Bench: Story = {}

export const Showcase: Story = {
  tags: ['!test'],
  args: { multiline: true, value: 'First line' },
}

/** The content-sized textarea still expands after typing a new line. */
export const GrowsWhileTyping: Story = {
  tags: ['!dev', '!autodocs'],
  render: function Render() {
    const [value, setValue] = useState('First line')
    return (
      <InputBase
        multiline
        value={value}
        onChange={event => setValue(event.target.value)}
        aria-label="Comment"
        className="w-[280px]"
      />
    )
  },
  play: async ({ canvasElement }) => {
    const field = within(canvasElement).getByRole('textbox', {
      name: 'Comment',
    })
    const initialHeight = field.getBoundingClientRect().height
    await userEvent.type(field, '{Enter}Second line')
    await waitFor(() =>
      expect(field.getBoundingClientRect().height).toBeGreaterThan(
        initialHeight
      )
    )
  },
}
