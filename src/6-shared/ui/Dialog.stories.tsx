import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from './Dialog'

const meta = {
  title: 'UI/Dialog',
  parameters: { layout: 'centered' },
} satisfies Meta

export default meta
type Story = StoryObj

const title = 'Delete this operation?'
const description =
  'It will be gone from every device once the change syncs. This text is long enough to run onto a second line in the paper.'

function Body({ onClose }: { onClose: () => void }) {
  return (
    <>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{description}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <button type="button" onClick={onClose}>
          Cancel
        </button>
        <button type="button" onClick={onClose}>
          Delete
        </button>
      </DialogActions>
    </>
  )
}

function Harness() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  return (
    <div className="flex gap-2">
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>

      <Dialog open={open} onClose={close}>
        <Body onClose={close} />
      </Dialog>
    </div>
  )
}

export const Default: Story = {
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole('button', { name: 'Open' })
    await userEvent.click(trigger)
    const dialog = await body.findByRole('dialog')
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Cancel' })
    )
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(trigger).toHaveFocus())
  },
}

export const Dark: Story = {
  ...Default,
  globals: { theme: 'dark' },
}

/** Dialog dismissal includes Escape and backdrop clicks. */
export const Dismissal: Story = {
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole('button', { name: 'Open' })

    await userEvent.click(trigger)
    await body.findByRole('dialog')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())

    await userEvent.click(trigger)
    const dialog = await body.findByRole('dialog')
    // Outside the paper is the backdrop, wherever the pointer lands on it.
    await userEvent.click(dialog.ownerDocument.body)
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(trigger).toHaveFocus())
  },
}
