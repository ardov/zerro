import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { Toaster, createToastManager, toast, type ToastType } from './Toast'
import { Button } from './Button'
import { Dialog } from './Dialog'

const meta = {
  title: 'UI Kit/Overlays/Toast',
  component: Toaster,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    docs: {
      description: {
        component: `Mount <Toaster /> once, then import toast and call toast.add({ title: 'Imported', type: 'success' }) from any event handler. The renderer must be mounted before calls. toast.add returns an ID; toast.update(id, options) updates it; toast.close(id) dismisses it, and toast.close() dismisses all. Reusing an ID replaces that notification and refreshes its timer. Default lifetime is six seconds; timeout: 0 and loading do not auto-dismiss. Updating loading to success resumes the timer. Action handlers own closing: actionProps follows Base UI button props. Dismissing never cancels an operation. Use a separate manager for each Storybook canvas or independent root. Notifications are transient events, not persistent application warnings. Hover or press F6 to expand the stack; touch devices can tap the stack. Swipe right/down to dismiss. Timers pause during interaction and window blur. At most three notifications are visible; overflow follows Base UI's limited-toast behavior, not a guaranteed delivery queue.`,
      },
    },
  },
} satisfies Meta<typeof Toaster>
export default meta
type Story = StoryObj<typeof meta>

function Demo(props: { modal?: boolean; global?: boolean }) {
  const { modal = false, global = false } = props
  const [isolatedManager] = useState(createToastManager)
  const manager = global ? toast : isolatedManager
  const [acted, setActed] = useState(false)
  const controls = (
    <div className="flex flex-wrap gap-3">
      {(
        [
          'neutral',
          'success',
          'info',
          'warning',
          'error',
          'loading',
        ] as ToastType[]
      ).map(type => (
        <Button
          key={type}
          variant="secondary"
          onClick={() =>
            manager.add({
              title: `${type} notification`,
              type,
              timeout: 0,
              description:
                type === 'error'
                  ? 'The backup could not be read. Choose another file and try again.'
                  : undefined,
            })
          }
        >
          {type}
        </Button>
      ))}
      <Button
        onClick={() =>
          manager.add({
            id: 'operation',
            title: 'Importing backup',
            type: 'loading',
          })
        }
      >
        Start import
      </Button>
      <Button
        onClick={() =>
          manager.update('operation', {
            title: 'Import complete',
            type: 'success',
            timeout: 0,
          })
        }
      >
        Finish import
      </Button>
      <Button
        onClick={() =>
          manager.add({
            title: 'Changes restored',
            timeout: 0,
            actionProps: { children: 'Review', onClick: () => setActed(true) },
          })
        }
      >
        With action
      </Button>
      <Button
        onClick={() =>
          manager.add({ title: 'Short notification', timeout: 250 })
        }
      >
        Timed
      </Button>
      <Button onClick={() => manager.close()}>Clear notifications</Button>
      <output aria-label="Action result">{acted ? 'Reviewed' : 'Ready'}</output>
    </div>
  )
  return (
    <main className="min-h-screen bg-ui-base p-6 text-ui-primary">
      <h1 className="mb-4 text-ui-20 font-medium">Toast notifications</h1>
      <p className="mb-6 text-ui-14 text-ui-secondary">
        Create several notifications, then hover or focus the stack. Each
        example owns its manager.
      </p>
      {modal ? (
        <Dialog
          title="Notification inside a surface"
          mobile="drawer"
          trigger={<Button>Open surface</Button>}
        >
          {controls}
        </Dialog>
      ) : (
        controls
      )}
      <Toaster manager={manager} />
    </main>
  )
}

export const Showcase: Story = { render: () => <Demo /> }
export const Lifecycle: Story = {
  ...Showcase,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Start import' }))
    await body.findByText('Importing backup')
    await userEvent.click(canvas.getByRole('button', { name: 'Start import' }))
    await expect(body.getAllByText('Importing backup')).toHaveLength(1)
    await userEvent.click(canvas.getByRole('button', { name: 'Finish import' }))
    await body.findByText('Import complete')
    await userEvent.click(canvas.getByRole('button', { name: 'With action' }))
    const region = body
      .getByText('Changes restored')
      .closest('[role=region]') as HTMLElement
    await userEvent.hover(region)
    await userEvent.click(body.getByRole('button', { name: 'Review' }))
    await expect(canvas.getByLabelText('Action result')).toHaveTextContent(
      'Reviewed'
    )
    await expect(body.getByText('Changes restored')).toBeVisible()
    await userEvent.click(
      canvas.getByRole('button', { name: 'Clear notifications' })
    )
    await waitFor(() =>
      expect(body.queryByText('Changes restored')).not.toBeInTheDocument()
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Timed' }))
    await body.findByText('Short notification')
    await waitFor(() =>
      expect(body.queryByText('Short notification')).not.toBeInTheDocument()
    )
  },
}
export const Stack: Story = {
  ...Showcase,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    for (const name of ['neutral', 'success', 'warning', 'error'])
      await userEvent.click(canvas.getByRole('button', { name }))
    await expect(
      body.getByText('neutral notification').closest('[role=dialog]')
    ).toHaveAttribute('inert')
    await userEvent.keyboard('{F6}')
    const region = body
      .getByText('error notification')
      .closest('[role=region]') as HTMLElement
    await expect(region).toHaveFocus()
    await expect(await body.findByText('success notification')).toBeVisible()
    await userEvent.tab()
    await userEvent.keyboard('{Escape}')
    await waitFor(() =>
      expect(body.queryByText('error notification')).not.toBeInTheDocument()
    )
  },
}
export const InDialog: Story = {
  render: () => <Demo modal />,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Open surface' })
    )
    const dialog = await body.findByRole('dialog', {
      name: 'Notification inside a surface',
    })
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'With action' })
    )
    await userEvent.keyboard('{F6}')
    await userEvent.tab()
    await userEvent.tab()
    await expect(body.getByRole('button', { name: 'Review' })).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect(
      within(dialog).getByLabelText('Action result')
    ).toHaveTextContent('Reviewed')
    await expect(dialog).toBeVisible()
    await userEvent.click(
      body.getByRole('button', { name: 'Dismiss notification' })
    )
    await waitFor(() =>
      expect(body.queryByText('Changes restored')).not.toBeInTheDocument()
    )
  },
}
export const Mobile: Story = {
  ...Stack,
  globals: { viewport: { value: 'iphone13' } },
}
export const InDrawer: Story = {
  ...InDialog,
  globals: { viewport: { value: 'iphone13' } },
}

export const GlobalManager: Story = {
  render: () => <Demo global />,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    const id = toast.add({ title: 'Created outside React', timeout: 0 })
    await body.findByText('Created outside React')
    toast.update(id, { title: 'Updated outside React', type: 'success' })
    await body.findByText('Updated outside React')
    toast.close(id)
    await waitFor(() =>
      expect(body.queryByText('Updated outside React')).not.toBeInTheDocument()
    )
  },
}

export const PausedTimer: Story = {
  ...Showcase,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Timed' })
    )
    const message = await body.findByText('Short notification')
    await userEvent.hover(message)
    // Longer than this fixture's timeout: interaction must keep it readable.
    await new Promise(resolve => setTimeout(resolve, 400))
    await expect(message).toBeVisible()
    await userEvent.unhover(message)
    await waitFor(() => expect(message).not.toBeInTheDocument())
  },
}
