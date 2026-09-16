import { useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { Popover } from './Popover'
import { Button } from './Button'
import { Input } from './Input'

const meta = {
  title: 'UI Kit/Popover',
  component: Popover,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Modal anchored content with optional title and free children. Default mobile="drawer" uses a bottom sheet below 500px; mobile="popover" keeps the anchored view. anchor positions the panel independently from the trigger that receives focus on closing. onClose fires once per actual close, including Back, not for adaptation or cleanup. Adaptive branches may remount content. Use PopoverSurface when visibility already belongs to an asked layer or screen.',
      },
    },
  },
  args: {
    title: 'Budget',
    trigger: <Button>Open popover</Button>,
    children: <Input label="Amount" />,
  },
} satisfies Meta<typeof Popover>
export default meta
type Story = StoryObj<typeof meta>
const checkPopover: Story['play'] = async ({ canvasElement, args }) => {
  const body = within(canvasElement.ownerDocument.body)
  const trigger = within(canvasElement).getByRole('button', {
    name: 'Open popover',
  })
  await userEvent.click(trigger)
  const popup = await body.findByRole('dialog', { name: 'Budget' })
  if (window.innerWidth < 500 && args.mobile !== 'popover')
    await expect(popup).toHaveAttribute('data-side', 'bottom')
  await waitFor(() => {
    const rect = popup.getBoundingClientRect()
    expect(rect.left).toBeGreaterThanOrEqual(0)
    expect(rect.right).toBeLessThanOrEqual(window.innerWidth)
    expect(rect.bottom).toBeLessThanOrEqual(window.innerHeight + 1)
    expect(popup).toContainElement(document.activeElement as HTMLElement)
  })
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(popup).not.toBeVisible())
  await waitFor(() => expect(trigger).toHaveFocus())
}
export const Desktop: Story = { play: checkPopover }
export const BelowBreakpoint: Story = {
  ...Desktop,
  globals: { viewport: { value: 'zerro499' } },
}
export const AtBreakpoint: Story = {
  ...Desktop,
  globals: { viewport: { value: 'zerro500' } },
}
export const FixedPopover: Story = {
  ...BelowBreakpoint,
  args: { mobile: 'popover' },
}
function IndependentAnchor() {
  const anchor = useRef<HTMLDivElement>(null)
  return (
    <div className="space-y-12">
      <div ref={anchor}>Anchor</div>
      <Popover
        label="Anchored editor"
        anchor={anchor}
        trigger={<Button>Edit</Button>}
      >
        <Input label="Draft" />
      </Popover>
    </div>
  )
}
export const SeparateAnchor: Story = {
  render: () => <IndependentAnchor />,
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: 'Edit' })
    await userEvent.click(trigger)
    const popup = await within(canvasElement.ownerDocument.body).findByRole(
      'dialog',
      { name: 'Anchored editor' }
    )
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(popup).not.toBeVisible())
    await waitFor(() => expect(trigger).toHaveFocus())
  },
}
function Adapting() {
  const [mobile, setMobile] = useState<'drawer' | 'popover'>('drawer')
  const [closed, setClosed] = useState(0)
  return (
    <>
      <output aria-label="Close count">{closed}</output>
      <Popover
        label="Adaptive editor"
        mobile={mobile}
        onClose={() => setClosed(n => n + 1)}
        trigger={<Button>Edit</Button>}
      >
        <Input label="Draft" defaultValue="" />
        <Button
          onClick={() => setMobile(mobile === 'drawer' ? 'popover' : 'drawer')}
        >
          Adapt
        </Button>
      </Popover>
    </>
  )
}
export const AdaptWithoutClosing: Story = {
  globals: { viewport: { value: 'iphone13' } },
  render: () => <Adapting />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Edit' }))
    await userEvent.type(
      await body.findByRole('textbox', { name: 'Draft' }),
      'Unsaved'
    )
    await userEvent.click(body.getByRole('button', { name: 'Adapt' }))
    await waitFor(() =>
      expect(body.getByRole('textbox', { name: 'Draft' })).toHaveValue('')
    )
    await expect(canvas.getByLabelText('Close count')).toHaveTextContent('0')
    await userEvent.keyboard('{Escape}')
    await waitFor(() =>
      expect(canvas.getByLabelText('Close count')).toHaveTextContent('1')
    )
  },
}
