import type { Meta, StoryObj } from '@storybook/react-vite'
import { Link } from './Link'

const meta = {
  title: 'UI/Link',
  parameters: { layout: 'padded' },
} satisfies Meta
export default meta
type Story = StoryObj

const modes = ['always', 'hover', 'none'] as const

export const Underlines: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-2">
      {modes.map(mode => (
        <Link key={mode} href="#" underline={mode}>
          {mode}
        </Link>
      ))}
    </div>
  ),
}

export const Dark: Story = { ...Underlines, globals: { theme: 'dark' } }
