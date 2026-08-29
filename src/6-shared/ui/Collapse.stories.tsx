import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
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
      <div data-testid="collapse">
        <Collapse open={open}>{content}</Collapse>
      </div>
    </div>
  )
}

const settled = (el: HTMLElement) =>
  waitFor(() =>
    expect(el.getAnimations().some(a => a.playState === 'running')).toBe(false)
  )

export const Transition: Story = {
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const host = canvas.getByTestId('collapse')
    const panel = () => host.querySelector<HTMLElement>('.owned-collapse')
    await expect(panel()).toBe(null)

    await userEvent.click(canvas.getByRole('button', { name: 'Toggle' }))
    const ownedBox = panel()!
    await waitFor(() =>
      expect(
        Math.round(ownedBox.getBoundingClientRect().height)
      ).toBeGreaterThan(0)
    )
    await settled(ownedBox)

    await userEvent.click(canvas.getByRole('button', { name: 'Toggle' }))
    await waitFor(() => expect(panel()).toBe(null))
  },
}

/** The root is layout-transparent inside a flex column. */
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
