import type { Meta, StoryObj } from '@storybook/react-vite'
import { Link } from './Link'

const meta = {
  title: 'Library/Display/Link',
  component: Link,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { children: 'A link', href: '#', underline: 'hover' },
} satisfies Meta<typeof Link>
export default meta
type Story = StoryObj<typeof meta>

const modes = ['always', 'hover', 'none'] as const

/** One component instance, entirely controlled by the Args panel. */
export const Bench: Story = {}

export const Showcase: Story = {
  tags: ['!test'],
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
