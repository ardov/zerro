import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { ActivityStats } from './ActivityStats'

const meta = {
  title: 'Finance/Monthly activity',
  component: ActivityStats,
  parameters: {
    layout: 'centered',
    app: { scenario: 'off-budget-transfers', route: '/budget' },
  },
} satisfies Meta<typeof ActivityStats>

export default meta
type Story = StoryObj<typeof meta>

export const Light: Story = {
  args: { month: '2026-03' },
  render: args => (
    <div className="flex w-[312px] flex-col gap-4">
      <div data-testid="background-reference" className="bg-background" />
      <ActivityStats {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const background = getComputedStyle(
      canvas.getByTestId('background-reference')
    ).backgroundColor
    for (const name of [/^Incomes /, /^Expenses /, /^Transfers /]) {
      const card = canvas.getByRole('button', { name })
      const style = getComputedStyle(card)
      await expect(style.backgroundColor).toBe(background)
      await expect(style.padding).toBe('16px')
      await expect(style.borderRadius).toBe('8px')
      await expect(style.alignItems).toBe('stretch')
    }
  },
}

export const Dark: Story = { ...Light, globals: { theme: 'dark' } }
