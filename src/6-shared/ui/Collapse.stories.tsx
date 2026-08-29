import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Collapse as MuiCollapse } from '@mui/material'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { Collapse } from './Collapse'

const meta = {
  title: 'UI/Collapse',
  parameters: { layout: 'padded' },
} satisfies Meta
export default meta
type Story = StoryObj

const content = (
  <div className="w-[280px] p-4">
    <p className="m-0">A paragraph that is tall enough to measure.</p>
    <p className="m-0">And a second one under it.</p>
  </div>
)

function Harness() {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex flex-col items-start gap-4">
      <button onClick={() => setOpen(o => !o)}>Toggle</button>
      <div data-testid="owned">
        <Collapse open={open}>{content}</Collapse>
      </div>
      <div data-testid="mui">
        <MuiCollapse in={open} unmountOnExit>
          {content}
        </MuiCollapse>
      </div>
    </div>
  )
}

const settled = (el: HTMLElement) =>
  waitFor(() =>
    expect(el.getAnimations().some(a => a.playState === 'running')).toBe(false)
  )

/** Same height when open, nothing at all when closed, and the same easing on
 * the way between. */
export const Parity: Story = {
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const owned = canvas.getByTestId('owned')
    const mui = canvas.getByTestId('mui')

    // Closed: `unmountOnExit` on both, so there is no panel to measure. Base
    // UI leaves its root behind, but it is a `display: contents` box with
    // nothing in it, so nothing is laid out for it either.
    const panel = (host: HTMLElement) =>
      host.querySelector<HTMLElement>('.owned-collapse, .MuiCollapse-root')
    await expect(panel(owned)).toBe(null)
    await expect(panel(mui)).toBe(null)

    await userEvent.click(canvas.getByRole('button', { name: 'Toggle' }))
    const ownedBox = panel(owned)!
    const muiBox = panel(mui)!

    // Mid-flight: both clip, and both are running the same transition.
    // The height transition, which is the animation. Only its first entry is
    // compared: MUI swaps a class to stop clipping when it arrives, and the
    // owned panel gets there with a second, delayed entry for `overflow`,
    // which MUI has no equivalent of to compare against.
    const heightTiming = (el: HTMLElement) => {
      const style = getComputedStyle(el)
      const first = (value: string) => value.split(',')[0].trim()
      return {
        property: first(style.transitionProperty),
        duration: first(style.transitionDuration),
        easing: style.transitionTimingFunction.split(')')[0] + ')',
        overflow: style.overflow,
      }
    }
    await expect(heightTiming(ownedBox)).toEqual(heightTiming(muiBox))

    await settled(ownedBox)
    await settled(muiBox)
    await waitFor(() =>
      expect(Math.round(ownedBox.getBoundingClientRect().height)).toBe(
        Math.round(muiBox.getBoundingClientRect().height)
      )
    )
    await expect(
      Math.round(ownedBox.getBoundingClientRect().height)
    ).toBeGreaterThan(0)
    // At rest MUI hands the height back to the content and stops clipping.
    // Polled rather than asserted once: the owned panel gets there through a
    // discrete transition held back until the height has finished, and a
    // discrete transition is not something `getAnimations` reports on.
    await waitFor(() =>
      expect(getComputedStyle(ownedBox).overflow).toBe(
        getComputedStyle(muiBox).overflow
      )
    )

    // And back to nothing.
    await userEvent.click(canvas.getByRole('button', { name: 'Toggle' }))
    await waitFor(() => expect(panel(owned)).toBe(null))
    await waitFor(() => expect(panel(mui)).toBe(null))
  },
}

/** The root is layout-transparent, so a collapse inside a flex column is one
 * box there, as MUI's was. */
export const InFlexColumn: Story = {
  render: () => (
    <div className="flex w-[280px] flex-col gap-2" data-testid="column">
      <div className="h-6 bg-accent">Above</div>
      <Collapse open>{content}</Collapse>
      <div className="h-6 bg-accent">Below</div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const column = within(canvasElement).getByTestId('column')
    await expect(column.children).toHaveLength(3)
  },
}

/** MUI settles on `height: auto`, so a panel whose content grows while it is
 * open follows it instead of clipping. Base UI keeps its measurement up to
 * date instead, and this is the story that says so. */
export const GrowsWhileOpen: Story = {
  render: function Render() {
    const [lines, setLines] = useState(1)
    return (
      <div className="flex flex-col items-start gap-4">
        <button onClick={() => setLines(n => n + 3)}>Add lines</button>
        <div data-testid="owned">
          <Collapse open>
            <div className="w-[280px]">
              {Array.from({ length: lines }, (_, i) => (
                <p key={i} className="m-0">
                  Line {i + 1}
                </p>
              ))}
            </div>
          </Collapse>
        </div>
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const panel = canvas
      .getByTestId('owned')
      .querySelector<HTMLElement>('.owned-collapse')!
    const inner = panel.firstElementChild as HTMLElement
    await settled(panel)
    await userEvent.click(canvas.getByRole('button', { name: 'Add lines' }))
    await settled(panel)
    await waitFor(() =>
      expect(Math.round(panel.getBoundingClientRect().height)).toBe(
        Math.round(inner.getBoundingClientRect().height)
      )
    )
  },
}
