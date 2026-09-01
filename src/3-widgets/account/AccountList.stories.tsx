import type { Meta, StoryObj } from '@storybook/react-vite'
import AccountList from './AccountList'
import { DebtorList } from '@/3-widgets/DebtorList'

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
