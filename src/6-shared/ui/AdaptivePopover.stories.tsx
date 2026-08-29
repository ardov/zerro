import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test'
import { AdaptivePopover } from './AdaptivePopover'
import { Button } from './Button'
import { zIndex } from './theme/palette'

const meta = {
  title: 'UI/Adaptive popover',
  component: AdaptivePopover,
  parameters: {
    layout: 'centered',
    app: { scenario: 'demo' },
  },
} satisfies Meta<typeof AdaptivePopover>

export default meta
type Story = StoryObj

function PopoverHarness(props: { drawerSide?: 'top' | 'bottom' }) {
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
          <h2 className="type-title">Responsive popover</h2>
          <p className="type-body text-muted-foreground">
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
  await expect(backdropStyle.zIndex).toBe(String(zIndex.modal))
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
  await userEvent.click(trigger)
  await body.findByRole('textbox', { name: 'Overlay input' })
  const backdrop = document.querySelector<HTMLElement>(ADAPTIVE_BACKDROP)!
  await userEvent.click(backdrop)
  await waitFor(() => expect(trigger).toHaveFocus())
  await expect(
    [document.body, document.documentElement].every(
      element => getComputedStyle(element).overflow !== 'hidden'
    )
  ).toBe(true)
}

export const Desktop: Story = {
  render: () => <PopoverHarness />,
  play: checkDismissal,
}

export const MobileDrawer: Story = {
  globals: { viewport: { value: 'iphone13' } },
  render: () => <PopoverHarness />,
  play: checkDismissal,
}

export const MobileTopDrawer: Story = {
  globals: { viewport: { value: 'iphone13' } },
  render: () => <PopoverHarness drawerSide="top" />,
  play: checkDismissal,
}

export const MobileSwipe: Story = {
  ...MobileTopDrawer,
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
  },
}
