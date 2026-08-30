import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'
import { useSnackbar } from './SnackbarProvider'

type SnackbarTriggerProps = { message: string }

function SnackbarTrigger({ message }: SnackbarTriggerProps) {
  const showSnackbar = useSnackbar()
  return (
    <Button onClick={() => showSnackbar({ message })}>Show snackbar</Button>
  )
}

const meta = {
  title: 'Library/Overlays/Snackbar',
  component: SnackbarTrigger,
  tags: ['autodocs'],
  args: { message: 'Saved in the story' },
} satisfies Meta<typeof SnackbarTrigger>

export default meta
type Story = StoryObj<typeof meta>

/** One notification trigger, whose message is supplied by Args. */
export const Bench: Story = {}
