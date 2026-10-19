import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test'
import { Button } from './kit/Button'
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

export const SmoothDismissal: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Show snackbar' }))
    const toast = await body.findByRole('status')
    await waitFor(() => expect(getComputedStyle(toast).opacity).toBe('1'))
    await Promise.all(
      toast.getAnimations().map(animation => animation.finished)
    )
    const before = toast.getBoundingClientRect().top
    const height = toast.getBoundingClientRect().height
    fireEvent.click(within(toast).getByLabelText('Dismiss notification'))
    const samples: { top: number; opacity: number }[] = []
    while (toast.isConnected && samples.length < 60) {
      samples.push({
        top: toast.getBoundingClientRect().top,
        opacity: Number(getComputedStyle(toast).opacity),
      })
      await new Promise(requestAnimationFrame)
    }
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      for (const sample of samples)
        expect(Math.abs(sample.top - before)).toBeLessThan(0.5)
    }
    // A nearly opaque notification must not jump to its final exit position.
    for (const sample of samples.filter(sample => sample.opacity > 0.8)) {
      expect(Math.abs(sample.top - before)).toBeLessThan(height * 0.75)
    }
    await waitFor(() => expect(toast).not.toBeInTheDocument())
  },
}

export const SwipeTowardsEntryEdge: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Show snackbar' }))
    const toast = await body.findByRole('status')
    await waitFor(() => expect(getComputedStyle(toast).opacity).toBe('1'))
    await Promise.all(
      toast.getAnimations().map(animation => animation.finished)
    )
    const before = toast.getBoundingClientRect()
    const x = before.left + 60
    const y = before.top + before.height / 2
    const pointer = userEvent.setup()
    // Base UI establishes its drag origin on the first move.
    await pointer.pointer([
      { target: toast, keys: '[MouseLeft>]', coords: { x, y } },
      { target: toast, coords: { x, y: y + 1 } },
      { target: toast, coords: { x, y: y + 16 } },
    ])
    expect(toast.getBoundingClientRect().top).toBeGreaterThan(before.top + 10)
    await pointer.pointer([
      { target: toast, coords: { x, y: y + 90 } },
      { target: toast, keys: '[/MouseLeft]', coords: { x, y: y + 90 } },
    ])
    await waitFor(() => expect(toast).not.toBeInTheDocument())
  },
}
