import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Drawer as MuiDrawer } from '@mui/material'
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
  const [which, setWhich] = useState<'owned' | 'mui' | null>(null)
  const close = () => setWhich(null)
  const content = (
    <div className="flex grow flex-col p-4">
      <input aria-label="Note" autoFocus />
      <button onClick={close}>Done</button>
    </div>
  )
  return (
    <div className="p-8">
      <button onClick={() => setWhich('owned')}>Open owned</button>
      <button onClick={() => setWhich('mui')}>Open MUI</button>
      <SideDrawer
        open={which === 'owned'}
        onClose={close}
        className={sheet}
        aria-label="Notes"
      >
        {content}
      </SideDrawer>
      <MuiDrawer
        anchor="right"
        open={which === 'mui'}
        onClose={close}
        slotProps={{ paper: { className: sheet } }}
      >
        {content}
      </MuiDrawer>
    </div>
  )
}

const measure = (paper: HTMLElement) => {
  const rect = paper.getBoundingClientRect()
  const style = getComputedStyle(paper)
  return {
    right: Math.round(rect.right),
    top: Math.round(rect.top),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    background: style.backgroundColor,
    // MUI's temporary drawer is a square-cornered flex column that scrolls
    // as a whole, and it hangs off the right edge at full height.
    radius: style.borderRadius,
    display: style.display,
    direction: style.flexDirection,
    overflowY: style.overflowY,
  }
}

/** The sheet's geometry against MUI's, in both themes and at both widths. */
const parity: Story['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const doc = canvasElement.ownerDocument
  const body = within(doc.body)
  const shots = []
  for (const name of ['Open owned', 'Open MUI']) {
    const trigger = canvas.getByRole('button', { name })
    await userEvent.click(trigger)
    const note = await body.findByRole('textbox', { name: 'Note' })
    const paper = note.closest<HTMLElement>(
      '[data-slot="side-drawer"], .MuiDrawer-paper'
    )!
    await waitFor(() => {
      expect(paper.getAnimations().some(a => a.playState === 'running')).toBe(
        false
      )
      expect(Math.round(paper.getBoundingClientRect().right)).toBe(
        doc.documentElement.clientWidth
      )
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
export const MobileParity: Story = {
  ...Parity,
  globals: { viewport: { value: 'iphone13' } },
}

/** Modal behaviour MUI's temporary drawer had: a focus trap, a scroll lock,
 * and dismissal by the backdrop. */
export const Dismissal: Story = {
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const doc = canvasElement.ownerDocument
    const body = within(doc.body)
    const trigger = canvas.getByRole('button', { name: 'Open owned' })
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
