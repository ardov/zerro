import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { useMemo } from 'react'
import { useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'
import { TransactionSummary } from '.'

const meta = {
  title: 'App/Transactions/TransactionSummary',
  component: TransactionSummary,
  parameters: {
    layout: 'centered',
    app: { scenario: 'demo', route: '/transactions' },
  },
  args: { query: { clauses: [] }, search: '', checked: [] },
  decorators: [
    Story => (
      <div className="w-90 overflow-hidden rounded-ui-card rounded-smooth shadow-ui-popover">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TransactionSummary>

export default meta
type Story = StoryObj<typeof meta>

/** Several flows in several currencies: every card has something to say. */
export const Everything: Story = {}

/** A few checked rows are only added up. */
export const Selection: Story = {
  render: args => {
    const ids = useAppSelector(core.transactions.selectIds)
    return <TransactionSummary {...args} checked={ids.slice(0, 2)} />
  },
}

/** One income among spending: looking at it keeps both cards and the way
 * back, on the same periods. */
export const LoneIncome: Story = {
  tags: ['check'],
  render: args => {
    const transactions = useAppSelector(core.transactions.selectAll)
    const ids = useMemo(() => {
      const byDate = Object.values(transactions)
        .filter(transaction => !transaction.deleted)
        .sort((a, b) => (a.date < b.date ? -1 : 1))
      const ofType = (type: string) =>
        byDate.filter(tr => core.transactions.getType(tr) === type)
      const spending = ofType('outcome')
      // Spread over the whole history, so the periods are years.
      const spread = [0, 0.25, 0.5, 0.75, 1].map(
        share => spending[Math.round(share * (spending.length - 1))]
      )
      return [...spread, ofType('income')[0]].map(tr => tr.id)
    }, [transactions])
    return <TransactionSummary {...args} transactionIds={ids} />
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const spending = await canvas.findAllByRole('button', { name: 'Expenses' })
    expect(spending).toHaveLength(2)
    await userEvent.click(spending[0])
    const income = await canvas.findAllByRole('button', { name: 'Income' })
    expect(income).toHaveLength(2)
    await userEvent.click(income[1])
    expect(
      await canvas.findAllByRole('button', { name: 'Expenses' })
    ).toHaveLength(2)
    // Neither does another step take the chart away.
    await userEvent.click(canvas.getByRole('button', { name: 'year' }))
    await canvas.findByRole('button', { name: 'month' })
  },
}
