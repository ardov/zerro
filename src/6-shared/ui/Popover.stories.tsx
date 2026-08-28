import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Popover as MuiPopover } from '@mui/material'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { Popover } from './Popover'

const meta = {
  title: 'UI/Popover',
  parameters: { layout: 'fullscreen' },
} satisfies Meta
export default meta
type Story = StoryObj

/** MUI's `anchorOrigin`/`transformOrigin` pair, in the two settings the app
 * used: over the anchor's top-left, and centred under its bottom edge. */
const origins = {
  over: {},
  below: {
    anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
    transformOrigin: { vertical: 'top', horizontal: 'center' },
  },
} as const

function Harness({
  edge = false,
  below = false,
}: {
  edge?: boolean
  below?: boolean
}) {
  const [anchor, setAnchor] = useState<HTMLDivElement | null>(null)
  const [which, setWhich] = useState<'owned' | 'mui' | null>(null)
  const close = () => setWhich(null)
  const content = (
    <div className="w-[280px] p-4">
      <input aria-label="Draft" autoFocus />
      <button onClick={close}>Done</button>
    </div>
  )
  return (
    <>
      {/* The same non-focusable anchor for both. Focus must return to the
          opener inside it, while geometry comes from the surrounding div. */}
      <div
        ref={setAnchor}
        className={edge ? 'fixed bottom-2 right-2' : 'fixed left-8 top-24'}
      >
        <button onClick={() => setWhich('owned')}>Open owned</button>
        <button onClick={() => setWhich('mui')}>Open MUI</button>
      </div>
      <Popover
        open={which === 'owned'}
        anchorEl={anchor}
        onClose={close}
        placement={below ? 'below' : 'over'}
        align={below ? 'center' : 'start'}
        aria-label="Draft popup"
      >
        {content}
      </Popover>
      <MuiPopover
        open={which === 'mui'}
        anchorEl={anchor}
        onClose={close}
        {...(below ? origins.below : origins.over)}
      >
        {content}
      </MuiPopover>
    </>
  )
}

const measure = (paper: HTMLElement) => {
  const rect = paper.getBoundingClientRect()
  const style = getComputedStyle(paper)
  return {
    left: Math.round(rect.left),
    top: Math.round(rect.top),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    background: style.backgroundColor,
    color: style.color,
    shadow: style.boxShadow,
    radius: style.borderRadius,
  }
}

const parity: Story['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const body = within(canvasElement.ownerDocument.body)
  const shots = []
  for (const name of ['Open owned', 'Open MUI']) {
    const trigger = canvas.getByRole('button', { name })
    await userEvent.click(trigger)
    const input = await body.findByRole('textbox', { name: 'Draft' })
    const paper = input.closest<HTMLElement>(
      '[data-slot="popover"], .MuiPopover-paper'
    )!
    await waitFor(() => {
      expect(getComputedStyle(paper).opacity).toBe('1')
      expect(
        paper
          .getAnimations()
          .some(animation => animation.playState === 'running')
      ).toBe(false)
    })
    shots.push(measure(paper))
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(paper).not.toBeVisible())
    await waitFor(() => expect(trigger).toHaveFocus())
  }
  expect(shots[0]).toEqual(shots[1])
}

export const Parity: Story = { render: () => <Harness />, play: parity }
export const DarkParity: Story = { ...Parity, globals: { theme: 'dark' } }
export const ViewportEdge: Story = {
  render: () => <Harness edge />,
  play: parity,
}
export const MobileViewportEdge: Story = {
  ...ViewportEdge,
  globals: { viewport: { value: 'iphone13' } },
}
/** The filter editor and the tag list drop clear of their anchor instead of
 * covering it, and the tag list centres itself under it. */
export const BelowCentered: Story = {
  render: () => <Harness below />,
  play: parity,
}
export const MobileBelowCentered: Story = {
  ...BelowCentered,
  globals: { viewport: { value: 'iphone13' } },
}
export const Dismissal: Story = {
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const doc = canvasElement.ownerDocument
    const body = within(doc.body)
    const trigger = canvas.getByRole('button', { name: 'Open owned' })
    await userEvent.click(trigger)
    const popup = await body.findByRole('dialog', { name: 'Draft popup' })
    const input = within(popup).getByRole('textbox', { name: 'Draft' })
    await waitFor(() => expect(input).toHaveFocus())
    for (let i = 0; i < 5; i++) {
      await userEvent.tab()
      await waitFor(() =>
        expect(popup).toContainElement(doc.activeElement as HTMLElement)
      )
    }
    await expect(
      [doc.body, doc.documentElement].some(
        el => getComputedStyle(el).overflow === 'hidden'
      )
    ).toBe(true)
    await userEvent.click(
      doc.querySelector<HTMLElement>('[data-slot="popover-backdrop"]')!
    )
    await waitFor(() => expect(popup).not.toBeVisible())
    await waitFor(() => expect(trigger).toHaveFocus())
    await expect(
      [doc.body, doc.documentElement].every(
        el => getComputedStyle(el).overflow !== 'hidden'
      )
    ).toBe(true)
  },
}
