import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { defineScreen } from '@/6-shared/overlays'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within, waitFor } from 'storybook/test'
import { Drawer, DrawerSurface } from './Drawer'
import { Button } from './Button'

const meta = {
  tags: ['autodocs'],
  title: 'UI Kit/Overlays/Drawer',
  component: Drawer,
  args: {
    label: 'Details',
    trigger: <Button>Open drawer</Button>,
    children: (
      <p className="p-4">
        A sheet with scrollable content, header or handle swipe dismissal and
        browser history.
      </p>
    ),
  },
  parameters: {
    controls: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Bottom or right sheet powered by Base UI. By default, the sheet opens at the bottom below 500px and on the right at 500px and above. From 500px, right sheets float inside the viewport with a themed inset and rounded corners on every side; below 500px a right sheet fills the screen as a page. Bottom sheets remain flush with the viewport. Set side="bottom" or side="right" to fix its placement. Requires OverlayHost in a Router; pass popup={usePopup()} for programmatic control. Back, Escape, backdrop and swipe close the same history entry. Bounded scrolling and safe-area padding. Focus returns to the trigger or the focused opener automatically. DrawerSurface accepts a controller when history is already owned by its caller; finalFocus overrides automatic restoration. Example: <Drawer label="Details" trigger={<Button>Open</Button>}>Content</Drawer>.',
      },
    },
  },
} satisfies Meta<typeof Drawer>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const LongContent: Story = {
  globals: { viewport: { value: 'iphone13' } },
  args: {
    children: (
      <div className="space-y-4 p-4">
        {Array.from({ length: 40 }, (_, index) => (
          <p key={index}>Detail {index + 1}</p>
        ))}
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', {
      name: 'Open drawer',
    })
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(trigger)
    const sheet = await body.findByRole('dialog', { name: 'Details' })
    await waitFor(() =>
      expect(sheet.getBoundingClientRect().top).toBeGreaterThanOrEqual(30)
    )
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(sheet).not.toBeVisible())
    await waitFor(() => expect(trigger).toHaveFocus())
  },
}

export const Right: Story = {
  globals: { viewport: { value: 'zerro500' } },
  args: { side: 'right' },
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', {
      name: 'Open drawer',
    })
    await userEvent.click(trigger)
    const sheet = await within(canvasElement.ownerDocument.body).findByRole(
      'dialog'
    )
    await waitFor(() => {
      const bounds = sheet.getBoundingClientRect()
      expect(bounds.right).toBeLessThan(window.innerWidth)
      expect(bounds.top).toBeGreaterThan(0)
      expect(bounds.bottom).toBeLessThan(window.innerHeight)
      expect(
        Math.abs(bounds.top - (window.innerWidth - bounds.right))
      ).toBeLessThan(1)
      expect(
        Math.abs(bounds.top - (window.innerHeight - bounds.bottom))
      ).toBeLessThan(1)
      expect(bounds.width).toBeLessThan(window.innerWidth)
    })
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(trigger).toHaveFocus())
  },
}

export const RightPage: Story = {
  globals: { viewport: { value: 'zerro499' } },
  args: { side: 'right' },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Open drawer' })
    )
    const sheet = await within(canvasElement.ownerDocument.body).findByRole(
      'dialog'
    )
    await waitFor(() => {
      const bounds = sheet.getBoundingClientRect()
      expect(bounds.left).toBe(0)
      expect(bounds.top).toBe(0)
      expect(bounds.width).toBe(window.innerWidth)
      expect(bounds.height).toBe(window.innerHeight)
    })
  },
}

function ChangingSide() {
  const [side, setSide] = useState<'bottom' | 'right'>('right')
  return (
    <Drawer label="Draft" side={side} trigger={<Button>Open drawer</Button>}>
      <input aria-label="Draft text" />
      <Button onClick={() => setSide(side === 'right' ? 'bottom' : 'right')}>
        Change side
      </Button>
    </Drawer>
  )
}
export const PreserveContent: Story = {
  render: () => <ChangingSide />,
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Open drawer' })
    )
    const body = within(canvasElement.ownerDocument.body)
    const sheet = await body.findByRole('dialog', { name: 'Draft' })
    const input = within(sheet).getByRole('textbox')
    await userEvent.type(input, 'Unfinished draft')
    await userEvent.click(
      within(sheet).getByRole('button', { name: 'Change side' })
    )
    await expect(sheet).toHaveAttribute('data-side', 'bottom')
    await expect(within(sheet).getByRole('textbox')).toBe(input)
    await expect(input).toHaveValue('Unfinished draft')
    await userEvent.keyboard('{Escape}')
  },
}

// Hosted editors mount already open; keep this lifecycle covered at the surface.
function MountedDrawer(props: { keepMounted?: boolean }) {
  const { keepMounted = false } = props
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open mounted drawer</Button>
      {(open || keepMounted) && (
        <DrawerSurface label="Mounted drawer" controller={{ open, setOpen }}>
          <p className="p-4">Mounted content</p>
        </DrawerSurface>
      )}
    </>
  )
}

export const MountedEntrance: Story = {
  globals: { viewport: { value: 'zerro500' } },
  render: () => <MountedDrawer />,
  play: async ({ canvasElement }) => {
    const doc = canvasElement.ownerDocument
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    const trigger = within(canvasElement).getByRole('button', {
      name: 'Open mounted drawer',
    })
    let entrances = 0
    const onTransition = (event: TransitionEvent) => {
      if (
        event.propertyName === (reducedMotion ? 'opacity' : 'translate') &&
        event.target instanceof HTMLElement &&
        event.target.getAttribute('role') === 'dialog' &&
        !event.target.hasAttribute('data-ending-style')
      )
        entrances++
    }
    doc.addEventListener('transitionrun', onTransition)
    try {
      for (let opening = 0; opening < 2; opening++) {
        entrances = 0
        await userEvent.click(trigger)
        const dialog = await within(doc.body).findByRole('dialog', {
          name: 'Mounted drawer',
        })
        await expect(dialog).toHaveAttribute(
          'data-side',
          window.innerWidth < 500 ? 'bottom' : 'right'
        )
        await waitFor(() => expect(entrances).toBeGreaterThan(0))
        if (reducedMotion)
          await expect(getComputedStyle(dialog).translate).toBe('none')
        await userEvent.keyboard('{Escape}')
        await waitFor(() =>
          expect(within(doc.body).queryByRole('dialog')).not.toBeInTheDocument()
        )
        await waitFor(() => expect(trigger).toHaveFocus())
      }
    } finally {
      doc.removeEventListener('transitionrun', onTransition)
    }
  },
}
export const MobileMountedEntrance: Story = {
  ...MountedEntrance,
  globals: { viewport: { value: 'zerro499' } },
  render: () => <MountedDrawer />,
}

export const ControlledReopen: Story = {
  ...MountedEntrance,
  render: () => <MountedDrawer keepMounted />,
}

export const Showcase: Story = {
  render: () => (
    <div className="grid gap-4">
      <p className="max-w-lg text-ui-secondary">
        Open a surface, explore its content and press Escape to dismiss. Try a
        narrow viewport to compare adaptive behavior.
      </p>
      <div className="flex flex-wrap gap-3">
        <Drawer
          title="Adaptive sheet"
          trigger={<Button variant="secondary">Adaptive sheet</Button>}
        >
          <p className="mb-4">Content can include text, fields and actions.</p>
          <p>Focus returns to the opener when this sheet closes.</p>
        </Drawer>
        <Drawer
          title="Right sheet"
          trigger={<Button variant="secondary">Right sheet</Button>}
          side="right"
        >
          <p className="mb-4">Content can include text, fields and actions.</p>
          <p>Focus returns to the opener when this sheet closes.</p>
        </Drawer>
        <Drawer
          title="Bottom sheet"
          trigger={<Button variant="secondary">Bottom sheet</Button>}
          side="bottom"
        >
          <p className="mb-4">Content can include text, fields and actions.</p>
          <p>Focus returns to the opener when this sheet closes.</p>
        </Drawer>
      </div>
    </div>
  ),
}

function touch(
  target: Element,
  type: 'touchstart' | 'touchmove' | 'touchend',
  x: number,
  y: number
) {
  const point = new Touch({ identifier: 1, target, clientX: x, clientY: y })
  const event = new TouchEvent(type, {
    bubbles: true,
    cancelable: true,
    touches: type === 'touchend' ? [] : [point],
    changedTouches: [point],
    targetTouches: type === 'touchend' ? [] : [point],
  })
  target.dispatchEvent(event)
  return event
}

/** Drags a finger across `target` in a few steps. Returns whether any move
 * was taken over by the drawer rather than left to the page to scroll. */
function drag(target: Element, dx: number, dy: number) {
  const rect = target.getBoundingClientRect()
  const x = rect.left + Math.min(40, rect.width / 2)
  const y = rect.top + Math.min(40, rect.height / 2)
  touch(target, 'touchstart', x, y)
  let taken = false
  for (const share of [0.1, 0.5, 1]) {
    const move = touch(target, 'touchmove', x + dx * share, y + dy * share)
    taken ||= move.defaultPrevented
  }
  touch(target, 'touchend', x + dx, y + dy)
  return taken
}

/** Opens the story's drawer and waits until it has slid fully into view. */
async function openSettled(canvasElement: HTMLElement, name: string) {
  const body = within(canvasElement.ownerDocument.body)
  await userEvent.click(within(canvasElement).getAllByRole('button')[0])
  const sheet = await body.findByRole('dialog', { name })
  await waitFor(() => {
    expect(sheet).not.toHaveAttribute('data-starting-style')
    const rect = sheet.getBoundingClientRect()
    expect(rect.right).toBeLessThanOrEqual(window.innerWidth + 1)
    expect(rect.bottom).toBeLessThanOrEqual(window.innerHeight + 1)
  })
  return sheet
}

export const ScrollGesture: Story = {
  globals: { viewport: { value: 'zerro499' } },
  args: {
    side: 'right',
    children: (
      <div aria-label="Scrollable content" className="h-64 overflow-y-auto">
        {Array.from({ length: 40 }, (_, i) => (
          <p key={i}>Row {i}</p>
        ))}
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    const sheet = await openSettled(canvasElement, 'Details')
    const content = within(sheet).getByLabelText('Scrollable content')
    // A scroll that drifts sideways stays a scroll: a side drawer is
    // dismissed from its header, not its body.
    expect(drag(content, 60, 12)).toBe(false)
    expect(drag(content, 20, 3)).toBe(false)
    await waitFor(() => expect(sheet).not.toHaveAttribute('data-swiping'))
    expect(sheet).toHaveAttribute('data-open')
    await userEvent.keyboard('{Escape}')
  },
}

/** SVG descendants must retain the surrounding body scroll instead of swiping. */
export const BottomSvgScrollGesture: Story = {
  globals: { viewport: { value: 'zerro499' } },
  args: {
    side: 'bottom',
    children: (
      <div aria-label="SVG scroller" className="h-64 overflow-y-auto">
        <div className="h-32" />
        <svg aria-label="Scroll target" width="80" height="80">
          <rect width="80" height="80" fill="currentColor" />
        </svg>
        <div className="h-200" />
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    const sheet = await openSettled(canvasElement, 'Details')
    const scroller = within(sheet).getByLabelText('SVG scroller')
    scroller.scrollTop = 100
    expect(scroller.scrollTop).toBe(100)
    const svg = within(sheet).getByLabelText('Scroll target')
    const rect = svg.querySelector('rect')!
    expect(drag(rect, 0, 40)).toBe(false)
    await waitFor(() => expect(sheet).not.toHaveAttribute('data-swiping'))
    expect(sheet).toHaveAttribute('data-open')
    await userEvent.keyboard('{Escape}')
  },
}

export const OwnScrollerGesture: Story = {
  ...ScrollGesture,
  args: { ...ScrollGesture.args, contentScrolls: true },
}

const historyDrawer = defineScreen<string>('drawerRegression')

function HistoryOwner() {
  const [value, setValue] = historyDrawer.use()
  const navigate = useNavigate()
  return (
    <>
      <Button onClick={() => setValue('details')}>Open history drawer</Button>
      <Button onClick={() => navigate(1)}>Forward</Button>
      <DrawerSurface
        title="History drawer"
        side="right"
        controller={{
          open: value !== undefined,
          setOpen: next => !next && setValue(null),
        }}
      >
        <p>Restored from history</p>
      </DrawerSurface>
    </>
  )
}

/** A screen swiped away stays closed while history catches up, and Forward
 * brings it back. The slow step itself is covered in the overlays tests:
 * stories run on a MemoryRouter, where steps land at once. */
export const HistorySwipeClose: Story = {
  globals: { viewport: { value: 'zerro499' } },
  render: () => <HistoryOwner />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const sheet = await openSettled(canvasElement, 'History drawer')
    drag(within(sheet).getByRole('heading', { name: 'History drawer' }), 300, 0)
    await waitFor(() => expect(sheet).not.toBeVisible())
    await userEvent.click(canvas.getByRole('button', { name: 'Forward' }))
    await expect(
      body.findByRole('dialog', { name: 'History drawer' })
    ).resolves.toBeVisible()
    await userEvent.keyboard('{Escape}')
  },
}

export const BottomBodySwipe: Story = {
  globals: { viewport: { value: 'zerro499' } },
  args: {
    side: 'bottom',
    children: <div className="h-64">Swipe the body down</div>,
  },
  play: async ({ canvasElement }) => {
    const sheet = await openSettled(canvasElement, 'Details')
    // A bottom sheet swipes along its scroll, which Base UI reconciles, so
    // the body keeps the gesture.
    drag(within(sheet).getByText('Swipe the body down'), 0, 200)
    await waitFor(() => expect(sheet).not.toBeVisible())
  },
}

/** Content with its own scroller, such as a virtual list, has no height of its
 * own to give: the bottom sheet takes its full height for it to fill. */
export const BottomOwnScroller: Story = {
  globals: { viewport: { value: 'zerro499' } },
  args: {
    side: 'auto',
    title: 'Transactions',
    label: undefined,
    contentScrolls: true,
    children: (
      <div aria-label="Own scroller" className="min-h-0 grow overflow-y-auto">
        {Array.from({ length: 80 }, (_, i) => (
          <p key={i}>Row {i}</p>
        ))}
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    const sheet = await openSettled(canvasElement, 'Transactions')
    expect(sheet).toHaveAttribute('data-side', 'bottom')
    expect(sheet.getBoundingClientRect().height).toBeCloseTo(
      window.innerHeight - 32,
      0
    )
    const scroller = within(sheet).getByLabelText('Own scroller')
    expect(scroller.scrollHeight).toBeGreaterThan(scroller.clientHeight)
    await userEvent.keyboard('{Escape}')
  },
}
