import type { Meta, StoryObj } from '@storybook/react-vite'
import { Box } from '@mui/material'
import AccountList from './AccountList'
import { DebtorList } from '3-widgets/DebtorList'

const meta = {
  title: 'Finance/Accounts',
  component: AccountList,
  parameters: {
    layout: 'centered',
    app: { scenario: 'demo', globalWidgets: true, route: '/accounts' },
  },
} satisfies Meta<typeof AccountList>

export default meta
type Story = StoryObj

export const AccountListWithDebtors: Story = {
  render: () => (
    <Box sx={{ width: 320, p: 2 }}>
      <AccountList />
      <DebtorList />
    </Box>
  ),
}

export const NarrowViewport: Story = {
  globals: { viewport: { value: 'iphone13' } },
  render: () => (
    <Box sx={{ width: '100%', maxWidth: 320, p: 1 }}>
      <AccountList />
    </Box>
  ),
}
