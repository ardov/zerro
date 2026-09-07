import type { Meta, StoryObj } from '@storybook/react-vite'
import { useMemo } from 'react'
import { useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'
import type { TTransaction } from '@/6-shared/types'
import { TransactionPreview, TrEmptyState } from '.'

const meta = {
  title: 'App/Transactions/TransactionPreview',
  component: TransactionPreview,
  parameters: {
    layout: 'centered',
    // The editor is a screen, so it wants the store and the overlay host the
    // application gives it. Not `/transactions`: that page lays this screen
    // out as a column of its own.
    app: { scenario: 'demo', route: '/budget' },
  },
} satisfies Meta<typeof TransactionPreview>

export default meta
type Story = StoryObj<typeof meta>

/** The demo store's first transaction of each type, so every story below is
 * about a real one rather than a shape assembled for the picture. */
function useByType() {
  const transactions = useAppSelector(core.transactions.selectAll)
  const debtAccountId = useAppSelector(core.accounts.selectDebtAccountId)
  return useMemo(() => {
    const found: Partial<Record<string, TTransaction>> = {}
    Object.values(transactions).forEach(tr => {
      const type = core.transactions.getType(tr, debtAccountId)
      if (!found[type] && !tr.deleted) found[type] = tr
    })
    return found
  }, [transactions, debtAccountId])
}

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div className="surface-card shadow-elevation-1 w-[360px] overflow-y-auto">
    {children}
  </div>
)

export const Bench: Story = {
  args: { id: '', onClose: () => {}, onOpenOther: () => {} },
  render: args => {
    const outcome = useByType().outcome
    return (
      <Frame>
        {outcome ? (
          <TransactionPreview {...args} id={outcome.id} />
        ) : (
          <TrEmptyState />
        )}
      </Frame>
    )
  },
}

export const Showcase: Story = {
  args: { id: '', onClose: () => {}, onOpenOther: () => {} },
  render: args => {
    const byType = useByType()
    const shown = ['outcome', 'income', 'transfer'] as const
    return (
      <div className="flex items-start gap-4">
        {shown.map(type => {
          const tr = byType[type]
          return (
            <Frame key={type}>
              {tr ? (
                <TransactionPreview {...args} id={tr.id} key={tr.id} />
              ) : (
                <TrEmptyState />
              )}
            </Frame>
          )
        })}
      </div>
    )
  },
}

/** Nothing selected. */
export const Empty: Story = {
  args: { id: 'missing', onClose: () => {}, onOpenOther: () => {} },
  render: args => (
    <Frame>
      <TransactionPreview {...args} />
    </Frame>
  ),
}
