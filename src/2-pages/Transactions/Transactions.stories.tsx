import type { Meta, StoryObj } from '@storybook/react-vite'
import { Layout } from '@/1-app/Layout'
import { pageColumns } from '@/1-app/pageColumns'
import TransactionsView from './index'
const meta = {
  title: 'App/Transactions/Page',
  component: TransactionsView,
} satisfies Meta<typeof TransactionsView>
export default meta
type Story = StoryObj<typeof meta>
export const PageSurface: Story = {
  parameters: {
    layout: 'fullscreen',
    app: { scenario: 'demo', route: '/transactions' },
  },
  render: () => (
    <Layout navigation columns={pageColumns.transactions}>
      <TransactionsView />
    </Layout>
  ),
}
