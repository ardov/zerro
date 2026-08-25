import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button, Stack } from '@mui/material'
import { useConfirm } from './SmartConfirm'
import { useSnackbar } from './SnackbarProvider'

const meta = {
  title: 'UI/Dialogs and feedback',
  parameters: {
    layout: 'centered',
    app: { scenario: 'demo', globalWidgets: true },
  },
} satisfies Meta

export default meta
type Story = StoryObj

function DialogTriggers() {
  const confirm = useConfirm({
    title: 'Delete this operation?',
    description: 'This story demonstrates the application confirmation dialog.',
    okText: 'Delete',
    cancelText: 'Cancel',
    onOk: () => undefined,
  })
  const showSnackbar = useSnackbar()

  return (
    <Stack direction="row" spacing={1}>
      <Button variant="contained" onClick={confirm}>
        Open confirmation
      </Button>
      <Button onClick={() => showSnackbar({ message: 'Saved in the story' })}>
        Show snackbar
      </Button>
    </Stack>
  )
}

export const Interactive: Story = { render: () => <DialogTriggers /> }
