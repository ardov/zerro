import type { Meta, StoryObj } from '@storybook/react-vite'
import { Amount } from './Amount'

const meta = {
  title: 'Library/Display/Amount',
  component: Amount,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { currency: 'RUB', value: 12345.67 },
} satisfies Meta<typeof Amount>

export default meta
type Story = StoryObj<typeof meta>

/** One component instance, entirely controlled by the Args panel. */
export const Bench: Story = {}

export const Showcase: Story = {
  tags: ['!test'],
  render: () => (
    <div className="flex flex-col gap-2">
      <div className="font-sans">
        <Amount value={1234.5} currency="RUB" decimals="ifOnly" />
      </div>
      <div className="font-sans">
        <Amount value={1234.5} currency="EUR" decimals="ifAny" sign />
      </div>
      <div className="font-sans">
        <Amount value={-1234.5} currency="USD" noShade />
      </div>
    </div>
  ),
}
