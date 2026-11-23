import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { Collapse } from './Collapse'

const content = (
  <div className="w-[280px] p-4">
    <p className="m-0">A paragraph that is tall enough to measure.</p>
    <p className="m-0">And a second one under it.</p>
  </div>
)

const meta = {
  title: 'UI Kit/Building blocks/Collapse',
  component: Collapse,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { children: content, open: true },
} satisfies Meta<typeof Collapse>
export default meta
type Story = StoryObj<typeof meta>

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

export const Bench: Story = {}

export const Transition: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const host = canvas.getByTestId('collapse')
    const panel = () => host.querySelector<HTMLElement>('.collapse-panel')
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

export const InFlexColumn: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="flex w-[280px] flex-col gap-2" data-testid="column">
      <div className="h-6 bg-ui-highlight">Above</div>
      <Collapse open>{content}</Collapse>
      <div className="h-6 bg-ui-highlight">Below</div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const above = canvas.getByText('Above').getBoundingClientRect()
    const below = canvas.getByText('Below').getBoundingClientRect()
    const panel = canvas
      .getByText('A paragraph that is tall enough to measure.')
      .parentElement!.getBoundingClientRect()
    const gap = parseFloat(
      getComputedStyle(canvas.getByTestId('column')).rowGap
    )
    expect(panel.top - above.bottom).toBeCloseTo(gap)
    expect(below.top - panel.bottom).toBeCloseTo(gap)
  },
}

export const GrowsWhileOpen: Story = {
  tags: ['!dev', '!autodocs'],
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
      .querySelector<HTMLElement>('.collapse-panel')!
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
