import type { Meta, StoryObj } from '@storybook/react-vite'
import { useAsk } from '6-shared/overlays'
import { Button } from './Button'
import { Confirm, type ConfirmProps } from './Confirm'

const meta = {
  title: 'Library/Overlays/Confirm',
  component: Confirm,
  tags: ['autodocs'],
  args: {
    cancelText: 'Cancel',
    description: 'This action cannot be undone.',
    okText: 'Delete',
    title: 'Delete this operation?',
  },
} satisfies Meta<typeof Confirm>

export default meta
type Story = StoryObj<typeof meta>

function ConfirmTrigger(args: ConfirmProps) {
  const ask = useAsk()
  return (
    <Button variant="contained" onClick={() => ask(<Confirm {...args} />)}>
      Open confirmation
    </Button>
  )
}

/** One confirmation instance, whose content is supplied by Args. */
export const Bench: Story = {
  render: args => <ConfirmTrigger {...args} />,
}
