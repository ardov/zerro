import type { Meta, StoryObj } from '@storybook/react-vite'
import AccountList from './AccountList'
import { DebtorList } from '@/3-widgets/DebtorList'
import { expect, waitFor, within } from 'storybook/test'
import { Account } from './AccountList/components'
import { makeAccount } from '@/zerro-core/support/testing/zenmoneyTestData'

const meta = {
  title: 'App/Accounts',
  component: AccountList,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    app: { scenario: 'demo', globalWidgets: true, route: '/accounts' },
  },
} satisfies Meta<typeof AccountList>

export default meta
type Story = StoryObj

export const BankMarks: Story = {
  render: () => (
    <div className="w-80">
      {[
        { id: 'known', title: 'Bank account', company: 12574 },
        { id: 'missing', title: 'Unknown bank', company: -1 },
        { id: 'cash', title: 'Cash', company: null },
      ].map(account => (
        <Account
          key={account.id}
          account={{
            ...makeAccount({ ...account, type: 'checking' }),
            fxCode: 'USD',
            inBudget: true,
            startBalanceReal: 0,
          }}
        />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const bank = canvas.getByRole('button', { name: /Bank account/ })
    const image = bank.querySelector('img')!
    await waitFor(() => expect(image.naturalWidth).toBeGreaterThan(0))
    expect(image.getBoundingClientRect().width).toBe(20)
    expect(image.getBoundingClientRect().height).toBe(20)
    for (const name of [/Unknown bank/, /Cash/]) {
      const row = canvas.getByRole('button', { name })
      expect(row.querySelector('img')).toBeNull()
      expect(row.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
      expect(row.getBoundingClientRect().height).toBe(
        bank.getBoundingClientRect().height
      )
    }
  },
}

export const AccountListWithDebtors: Story = {
  render: () => (
    <div className="w-[320px] p-4">
      <AccountList />
      <DebtorList />
    </div>
  ),
}

export const NarrowViewport: Story = {
  globals: { viewport: { value: 'iphone13' } },
  render: () => (
    <div className="w-full max-w-[320px] p-2">
      <AccountList />
    </div>
  ),
}
