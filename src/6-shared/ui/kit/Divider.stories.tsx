import type { Meta, StoryObj } from '@storybook/react-vite'
import { Divider } from './Divider'

const meta = {
  title: 'UI Kit/Building blocks/Divider',
  component: Divider,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A semantic horizontal separator. Fills its container without shrinking in flex layouts. Use ListRowSeparator for spacing within kit lists.',
      },
    },
  },
  decorators: [
    Story => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Divider>
export default meta
type Story = StoryObj<typeof meta>
export const Bench: Story = {}
