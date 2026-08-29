import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { SideDrawer } from './SideDrawer'

const meta = {
  title: 'UI/Side drawer',
  parameters: { layout: 'fullscreen' },
} satisfies Meta
export default meta
type Story = StoryObj

const sheet = 'w-screen sm:w-[360px]'

function Harness() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const content = (
    <div className="flex grow flex-col p-4">
      <input aria-label="Note" autoFocus />
      <button onClick={close}>Done</button>
    </div>
  )
  return (
    <div className="p-8">
      <button onClick={() => setOpen(true)}>Open</button>
      <SideDrawer
        open={open}
        onClose={close}
        className={sheet}
        aria-label="Notes"
      >
        {content}
      </SideDrawer>
    </div>
  )
}

const checkDrawer: Story['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const doc = canvasElement.ownerDocument
  const body = within(doc.body)
  const trigger = canvas.getByRole('button', { name: 'Open' })
  await userEvent.click(trigger)
  const note = await body.findByRole('textbox', { name: 'Note' })
  const paper = note.closest<HTMLElement>('[data-slot="side-drawer"]')!
  await waitFor(() =>
    expect(Math.round(paper.getBoundingClientRect().right)).toBe(
      doc.documentElement.clientWidth
    )
  )
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(paper).not.toBeVisible())
  await waitFor(() => expect(trigger).toHaveFocus())
}

export const Default: Story = { render: () => <Harness />, play: checkDrawer }
export const Dark: Story = { ...Default, globals: { theme: 'dark' } }
export const Mobile: Story = {
  ...Default,
  globals: { viewport: { value: 'iphone13' } },
}

/** Modal behaviour: a focus trap, a scroll lock, and backdrop dismissal. */
export const Dismissal: Story = {
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const doc = canvasElement.ownerDocument
    const body = within(doc.body)
    const trigger = canvas.getByRole('button', { name: 'Open' })
    await userEvent.click(trigger)
    const sheet = await body.findByRole('dialog', { name: 'Notes' })
    const note = within(sheet).getByRole('textbox', { name: 'Note' })
    await waitFor(() => expect(note).toHaveFocus())
    for (let i = 0; i < 4; i++) {
      await userEvent.tab()
      await waitFor(() =>
        expect(sheet).toContainElement(doc.activeElement as HTMLElement)
      )
    }
    await expect(
      [doc.body, doc.documentElement].some(
        el => getComputedStyle(el).overflow === 'hidden'
      )
    ).toBe(true)
    await userEvent.click(
      doc.querySelector<HTMLElement>('[data-slot="side-drawer-backdrop"]')!
    )
    await waitFor(() => expect(sheet).not.toBeVisible())
    await waitFor(() => expect(trigger).toHaveFocus())
    await expect(
      [doc.body, doc.documentElement].every(
        el => getComputedStyle(el).overflow !== 'hidden'
      )
    ).toBe(true)
  },
}
