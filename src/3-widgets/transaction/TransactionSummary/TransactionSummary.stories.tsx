import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { useMemo } from 'react'
import { useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'
import { TransactionSummary, type TransactionSummaryProps } from '.'
import { useListTransactions } from '../TransactionList/useListTransactions'
import type { TTransactionId } from '@/6-shared/types'

function Example({
  transactionIds,
  ...props
}: Omit<TransactionSummaryProps, 'list'> & {
  transactionIds?: TTransactionId[]
}) {
  const list = useListTransactions(transactionIds, props)
  return <TransactionSummary {...props} list={list} />
}

const meta = {
  title: 'App/Transactions/TransactionSummary',
  component: Example,
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
} satisfies Meta<typeof Example>

export default meta
type Story = StoryObj<typeof meta>

export const Everything: Story = {}

export const Selection: Story = {
  render: args => {
    const ids = useAppSelector(core.transactions.selectIds)
    return <Example {...args} checked={ids.slice(0, 2)} />
  },
}

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
      const spread = [0, 0.25, 0.5, 0.75, 1].map(
        share => spending[Math.round(share * (spending.length - 1))]
      )
      return [...spread, ofType('income')[0]].map(tr => tr.id)
    }, [transactions])
    return <Example {...args} transactionIds={ids} />
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
    await userEvent.click(canvas.getByRole('button', { name: 'year' }))
    await canvas.findByRole('button', { name: 'month' })
  },
}
