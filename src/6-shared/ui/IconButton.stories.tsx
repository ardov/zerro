import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconButton } from './Button'
import { AddIcon } from './Icons'

const meta = {
  title: 'Library/Input/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  args: {
    'aria-label': 'Add',
    children: <AddIcon />,
    color: 'default',
    size: 'medium',
  },
} satisfies Meta<typeof IconButton>

export default meta
type Story = StoryObj<typeof meta>

/** One component instance, entirely controlled by the Args panel. */
export const Bench: Story = {}

const cases = [
  { color: 'default', size: 'medium', edge: undefined },
  { color: 'default', size: 'small', edge: undefined },
  { color: 'inherit', size: 'small', edge: undefined },
  { color: 'primary', size: 'small', edge: undefined },
  { color: 'default', size: 'medium', edge: 'end' },
] as const

export const Showcase: Story = {
  tags: ['!test'],
  render: () => (
    <div className="flex flex-col gap-4 text-info">
      {cases.map(item => (
        <IconButton
          key={`${item.color}-${item.size}-${item.edge || 'none'}`}
          aria-label="Add"
          {...item}
        >
          <AddIcon />
        </IconButton>
      ))}
    </div>
  ),
}
