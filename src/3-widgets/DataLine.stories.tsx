import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor, within } from 'storybook/test'
import { OneLiner } from './DataLine'

const meta = {
  title: 'App/Budgets/Summary line',
  component: OneLiner,
  args: { left: 'Label', right: '100' },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof OneLiner>
export default meta
type Story = StoryObj<typeof meta>

export const Overflow: Story = {
  render: () => (
    <div className="flex w-64 flex-col gap-2">
      <OneLiner left="Short label" right={<span>100</span>} />
      <OneLiner
        left="A very long budget summary that cannot fit beside the amount"
        right={<span>200</span>}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(getComputedStyle(canvas.getByText('Short label')).maskImage).toBe(
      'none'
    )
    await waitFor(() =>
      expect(
        getComputedStyle(canvas.getByText(/A very long budget summary/))
          .maskImage
      ).not.toBe('none')
    )
    const amount = canvas.getByText('200').parentElement!
    expect(getComputedStyle(amount).maskImage).toBe('none')
    expect(amount.getBoundingClientRect().right).toBeLessThanOrEqual(
      canvasElement.getBoundingClientRect().right
    )
  },
}
