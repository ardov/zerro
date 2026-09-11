import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePopup } from '@/6-shared/overlays'
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test'
import { AdaptivePopover } from './AdaptivePopover'
import { Button } from './Button'

const meta = {
  title: 'Library/Overlays/AdaptivePopover',
  component: AdaptivePopover,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: { drawerSide: 'bottom' },
} satisfies Meta<typeof AdaptivePopover>

export default meta
type Story = StoryObj

function PopoverHarness(props: {
  drawerSide?: 'left' | 'right' | 'top' | 'bottom'
}) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const open = Boolean(anchorEl)
  return (
    <>
      <Button
        onClick={event => setAnchorEl(event.currentTarget)}
        variant="outlined"
      >
        Open adaptive surface
      </Button>
      <AdaptivePopover
        open={open}
        anchorEl={anchorEl}
        drawerSide={props.drawerSide || 'bottom'}
        aria-label="Responsive popover"
        onClose={() => setAnchorEl(null)}
      >
        <div className="min-w-[280px] p-6">
          <h2 className="text-title">Responsive popover</h2>
          <p className="text-body text-muted-foreground">
            Popover on desktop, swipeable drawer on mobile.
          </p>
          <input aria-label="Overlay input" autoFocus />
          <button type="button" onClick={() => setAnchorEl(null)}>
            Close surface
          </button>
        </div>
      </AdaptivePopover>
    </>
  )
}

// Above the breakpoint the surface is the owned `Popover` itself, so each
// responsive half answers to a slot of its own.
const ADAPTIVE_SURFACE = '[data-slot="adaptive-popup"], [data-slot="popover"]'
const ADAPTIVE_BACKDROP =
  '[data-slot="adaptive-backdrop"], [data-slot="popover-backdrop"]'

const checkDismissal: Story['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const body = within(canvasElement.ownerDocument.body)
  const trigger = canvas.getByRole('button', { name: 'Open adaptive surface' })
  await userEvent.click(trigger)
  const input = await body.findByRole('textbox', { name: 'Overlay input' })
  // Both responsive variants must put focus inside the overlay.
  await waitFor(() =>
    expect(
      document.activeElement === input ||
        input.closest('[role="dialog"]')?.contains(document.activeElement)
    ).toBe(true)
  )
  await expect(
    [document.body, document.documentElement].some(
      element => getComputedStyle(element).overflow === 'hidden'
    )
  ).toBe(true)
  // Elevation and stacking come from theme tokens, not arbitrary values, and
  // both responsive variants carry the sr-only Close part.
  const popup = input.closest<HTMLElement>(ADAPTIVE_SURFACE)!
  const backdropStyle = getComputedStyle(
    document.querySelector<HTMLElement>(ADAPTIVE_BACKDROP)!
  )
  await expect(getComputedStyle(popup).boxShadow).not.toBe('none')
  // Read back off the root rather than restated here, so the assertion still
  // names the token and not a number that can drift from it.
  await expect(backdropStyle.zIndex).toBe(
    getComputedStyle(document.documentElement)
      .getPropertyValue('--z-index-modal')
      .trim()
  )
  await expect(
    within(popup).getByRole('button', { name: 'Close' })
  ).toBeInTheDocument()
  await userEvent.keyboard('{Escape}')
  await waitFor(() =>
    expect(
      body.queryByRole('textbox', { name: 'Overlay input' })
    ).not.toBeInTheDocument()
  )
  await waitFor(() => expect(trigger).toHaveFocus())
  await userEvent.click(trigger)
  await userEvent.click(
    await body.findByRole('button', { name: 'Close surface' })
  )
  await waitFor(() => expect(trigger).toHaveFocus())
  await expect(trigger.matches(':focus-visible')).toBe(false)
  await userEvent.click(trigger)
  await body.findByRole('textbox', { name: 'Overlay input' })
  const backdrop = document.querySelector<HTMLElement>(ADAPTIVE_BACKDROP)!
  await userEvent.click(backdrop)
  await waitFor(() => expect(trigger).toHaveFocus())
  await expect(trigger.matches(':focus-visible')).toBe(false)
  await expect(
    [document.body, document.documentElement].every(
      element => getComputedStyle(element).overflow !== 'hidden'
    )
  ).toBe(true)
}

/** One component instance, with its visual props supplied by Args. */
export const Bench: Story = {
  render: args => (
    <PopoverHarness
      drawerSide={
        (args as { drawerSide?: 'left' | 'right' | 'top' | 'bottom' })
          .drawerSide
      }
    />
  ),
}

export const Desktop: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <PopoverHarness />,
  play: checkDismissal,
}

export const MobileDrawer: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { viewport: { value: 'iphone13' } },
  render: () => <PopoverHarness />,
  play: checkDismissal,
}

export const MobileTopDrawer: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { viewport: { value: 'iphone13' } },
  render: () => <PopoverHarness drawerSide="top" />,
  play: checkDismissal,
}

export const MobileSwipe: Story = {
  ...MobileTopDrawer,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole('button', {
      name: 'Open adaptive surface',
    })
    await userEvent.click(trigger)
    const popup = await body.findByRole('dialog', {
      name: 'Responsive popover',
    })
    await waitFor(() => expect(popup.getBoundingClientRect().top).toBe(0))
    const rect = popup.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.bottom - 12
    const touch = (clientY: number) =>
      new Touch({ identifier: 1, target: popup, clientX: x, clientY })
    fireEvent.touchStart(popup, {
      touches: [touch(y)],
      changedTouches: [touch(y)],
    })
    fireEvent.touchMove(popup, {
      touches: [touch(y - 30)],
      changedTouches: [touch(y - 30)],
    })
    fireEvent.touchMove(popup, {
      touches: [touch(0)],
      changedTouches: [touch(0)],
    })
    fireEvent.touchEnd(popup, { touches: [], changedTouches: [touch(0)] })
    await waitFor(() => expect(popup).not.toBeVisible())
    await waitFor(() => expect(trigger).toHaveFocus())
    await expect(trigger.matches(':focus-visible')).toBe(false)
  },
}

function CompletionHarness() {
  const [open, setOpen] = usePopup()
  const navigate = useNavigate()
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null)
  const [opened, setOpened] = useState(0)
  const [closed, setClosed] = useState(0)
  return (
    <>
      <Button ref={setAnchor} onClick={() => setOpen(true)}>
        Open counted surface
      </Button>
      <output data-testid="completions">
        {opened}/{closed}
      </output>
      <AdaptivePopover
        open={open}
        anchorEl={anchor}
        onClose={() => setOpen(false)}
        onOpenComplete={() => setOpened(count => count + 1)}
        onCloseComplete={() => setClosed(count => count + 1)}
        alignOffset={2}
        sideOffset={3}
        aria-label="Counted surface"
      >
        <div className="p-6">
          <button onClick={() => setOpen(false)}>Close counted surface</button>
          <button onClick={() => navigate(-1)}>History Back</button>
        </div>
      </AdaptivePopover>
    </>
  )
}

const checkCompletions: Story['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const body = within(canvasElement.ownerDocument.body)
  const trigger = canvas.getByRole('button', { name: 'Open counted surface' })
  const counts = canvas.getByTestId('completions')
  for (const [index, close] of [
    'Escape',
    'Close counted surface',
    'History Back',
  ].entries()) {
    await userEvent.click(trigger)
    const popup = await body.findByRole('dialog', { name: 'Counted surface' })
    await waitFor(() =>
      expect(counts).toHaveTextContent(`${index + 1}/${index}`)
    )
    await expect(popup).not.toHaveAttribute('alignOffset')
    await expect(popup).not.toHaveAttribute('sideOffset')
    if (close === 'Escape') await userEvent.keyboard('{Escape}')
    else
      await userEvent.click(within(popup).getByRole('button', { name: close }))
    await waitFor(() =>
      expect(counts).toHaveTextContent(`${index + 1}/${index + 1}`)
    )
    await waitFor(() => expect(popup).not.toBeInTheDocument())
    await expect(trigger).toHaveFocus()
  }
}

export const DesktopCompletion: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { viewport: { value: 'zerro900' } },
  render: () => <CompletionHarness />,
  play: checkCompletions,
}

export const MobileCompletion: Story = {
  ...DesktopCompletion,
  globals: { viewport: { value: 'zerro899' } },
}
