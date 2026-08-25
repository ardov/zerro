import type { Meta, StoryObj } from '@storybook/react-vite'
import { Typography } from '@mui/material'
import { Amount } from './Amount'

const meta = {
  title: 'UI/Amount',
  component: Amount,
  parameters: { layout: 'centered' },
  args: { currency: 'RUB' },
} satisfies Meta<typeof Amount>

export default meta
type Story = StoryObj

export const Positive: Story = { args: { value: 12345.67 } }
export const Negative: Story = { args: { value: -9876.5, sign: true } }
export const Zero: Story = { args: { value: 0 } }
export const WithSign: Story = { args: { value: 420, sign: true } }

export const CurrencyAndDecimalVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Typography>
        <Amount value={1234.5} currency="RUB" decimals="ifOnly" />
      </Typography>
      <Typography>
        <Amount value={1234.5} currency="EUR" decimals="ifAny" sign />
      </Typography>
      <Typography>
        <Amount value={-1234.5} currency="USD" noShade />
      </Typography>
    </div>
  ),
}
