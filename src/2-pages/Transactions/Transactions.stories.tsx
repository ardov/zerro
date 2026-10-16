import type { Meta, StoryObj } from '@storybook/react-vite'
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
    <div className="flex h-dvh gap-2 bg-ui-base p-2">
      <TransactionsView />
    </div>
  ),
}
