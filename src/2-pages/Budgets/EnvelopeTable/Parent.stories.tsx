import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { Parent } from './Parent'

const meta = {
  title: 'App/Budgets/CategoryDisclosure',
  component: Parent,
  args: {
    id: 'tag#category',
    isExpanded: false,
    parent: <div className="h-12 pl-10">Category</div>,
    children: [
      <div key="child" className="pl-10">
        Child category
      </div>,
    ],
    onExpandToggle: fn(),
    onExpandAll: fn(),
    onCollapseAll: fn(),
  },
  render: function Render(args) {
    const [expanded, setExpanded] = useState(false)
    return (
      <div className="w-64">
        <Parent
          {...args}
          isExpanded={expanded}
          onExpandToggle={id => {
            args.onExpandToggle(id)
            setExpanded(value => !value)
          }}
        />
      </div>
    )
  },
} satisfies Meta<typeof Parent>
export default meta
type Story = StoryObj<typeof meta>

export const Toggle: Story = {
  play: async ({ canvasElement, args }) => {
    const user = userEvent.setup()
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: 'Expand category' })
    expect(button.getBoundingClientRect().width).toBe(32)
    expect(button.getBoundingClientRect().height).toBe(32)
    expect(
      parseFloat(getComputedStyle(button).borderTopLeftRadius)
    ).toBeGreaterThanOrEqual(16)
    await user.click(button)
    expect(args.onExpandToggle).toHaveBeenCalledWith('tag#category')
    expect(button).toHaveAttribute('aria-expanded', 'true')
    await expect(canvas.getByText('Child category')).toBeVisible()
    await user.keyboard('{Alt>}')
    await user.click(button)
    await user.keyboard('{/Alt}')
    expect(args.onCollapseAll).toHaveBeenCalledOnce()
    await user.click(button)
    await waitFor(() =>
      expect(canvas.queryByText('Child category')).not.toBeInTheDocument()
    )
    await user.keyboard('{Alt>}')
    await user.click(button)
    await user.keyboard('{/Alt}')
    expect(args.onExpandAll).toHaveBeenCalledOnce()
  },
}
