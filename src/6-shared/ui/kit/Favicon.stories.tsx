import type { Meta, StoryObj } from '@storybook/react-vite'
import { Globe } from 'lucide-react'
import { Favicon } from './Favicon'

const meta = {
  title: 'UI Kit/Data display/Favicon',
  component: Favicon,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { domain: 'github.com', fallback: <Globe size={20} /> },
} satisfies Meta<typeof Favicon>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const Fallback: Story = { args: { domain: undefined } }
