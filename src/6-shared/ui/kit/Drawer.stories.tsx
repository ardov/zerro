import { useState } from 'react'
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
        A sheet with content, swipe dismissal and browser history.
      </p>
    ),
  },
  parameters: {
    controls: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Bottom or right sheet powered by Base UI. By default, the sheet opens at the bottom below 500px and on the right at 500px and above. Set side="bottom" or side="right" to fix its placement. Requires OverlayHost in a Router; pass popup={usePopup()} for programmatic control. Back, Escape, backdrop and swipe close the same history entry. Bounded scrolling and safe-area padding. Focus returns to the trigger or the focused opener automatically. DrawerSurface accepts a controller when history is already owned by its caller; finalFocus overrides automatic restoration. Example: <Drawer label="Details" trigger={<Button>Open</Button>}>Content</Drawer>.',
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
      expect(Math.abs(bounds.right - window.innerWidth)).toBeLessThan(2)
      expect(bounds.top).toBe(0)
      expect(Math.abs(bounds.height - window.innerHeight)).toBeLessThan(2)
      expect(bounds.width).toBeLessThan(window.innerWidth)
    })
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(trigger).toHaveFocus())
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
