import type { Meta, StoryObj } from '@storybook/react-vite'
import { ButtonBase } from './ButtonBase'

const meta = {
  title: 'UI Kit/Actions/ButtonBase',
  component: ButtonBase,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'An unstyled Base UI button with keyboard focus and disabled behavior. Callers own its dimensions, colors and layout. Prefer Button or IconButton for standard actions.',
      },
    },
  },
  args: {
    children: 'Custom action',
    className:
      'rounded-ui-control rounded-smooth bg-ui-card p-4 text-ui-primary',
  },
} satisfies Meta<typeof ButtonBase>
export default meta
type Story = StoryObj<typeof meta>
export const Bench: Story = {}
export const Disabled: Story = { args: { disabled: true } }
