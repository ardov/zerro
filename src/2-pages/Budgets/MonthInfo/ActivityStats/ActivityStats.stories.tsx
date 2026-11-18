import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { ActivityStats } from './ActivityStats'

const meta = {
  title: 'App/Budgets/MonthlyActivity',
  component: ActivityStats,
  tags: ['autodocs'],
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
      <div data-testid="background-reference" className="bg-ui-base" />
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

export const TransferList: Story = {
  args: { month: '2026-03' },
  parameters: { app: { globalWidgets: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: /^Transfers / }))
    await userEvent.click(await canvas.findByText('N26 EUR'))
    const list = within(
      await within(canvasElement.ownerDocument.body).findByRole('dialog', {
        name: 'Transactions',
      })
    )
    await expect(
      list.getByRole('button', { name: 'Transfers ↔ N26 EUR' })
    ).toBeVisible()
    await expect(
      list.getByRole('button', { name: /^Mar( 2026)?$/ })
    ).toBeVisible()
  },
}
