import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { Popover } from './Popover'

const meta = {
  title: 'UI/Popover',
  parameters: { layout: 'fullscreen' },
} satisfies Meta
export default meta
type Story = StoryObj

function Harness({
  edge = false,
  below = false,
}: {
  edge?: boolean
  below?: boolean
}) {
  const [anchor, setAnchor] = useState<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const content = (
    <div className="w-[280px] p-4">
      <input aria-label="Draft" autoFocus />
      <button onClick={close}>Done</button>
    </div>
  )
  return (
    <>
      <div
        ref={setAnchor}
        className={edge ? 'fixed bottom-2 right-2' : 'fixed left-8 top-24'}
      >
        <button onClick={() => setOpen(true)}>Open</button>
      </div>
      <Popover
        open={open}
        anchorEl={anchor}
        onClose={close}
        placement={below ? 'below' : 'over'}
        align={below ? 'center' : 'start'}
        aria-label="Draft popup"
      >
        {content}
      </Popover>
    </>
  )
}

const checkPopup: Story['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const body = within(canvasElement.ownerDocument.body)
  const trigger = canvas.getByRole('button', { name: 'Open' })
  await userEvent.click(trigger)
  const input = await body.findByRole('textbox', { name: 'Draft' })
  const paper = input.closest<HTMLElement>('[data-slot="popover"]')!
  await waitFor(() => expect(getComputedStyle(paper).opacity).toBe('1'))
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(paper).not.toBeVisible())
  await waitFor(() => expect(trigger).toHaveFocus())
}

export const Default: Story = { render: () => <Harness />, play: checkPopup }
export const Dark: Story = { ...Default, globals: { theme: 'dark' } }
export const ViewportEdge: Story = {
  render: () => <Harness edge />,
  play: checkPopup,
}
export const MobileViewportEdge: Story = {
  ...ViewportEdge,
  globals: { viewport: { value: 'iphone13' } },
}
/** The filter editor and the tag list drop clear of their anchor instead of
 * covering it, and the tag list centres itself under it. */
export const BelowCentered: Story = {
  render: () => <Harness below />,
  play: checkPopup,
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
    const trigger = canvas.getByRole('button', { name: 'Open' })
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
