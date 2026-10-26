import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { Layout } from '@/1-app/Layout'
import { AdaptivePanel } from './AdaptivePanel'
import { Columns } from './Columns'
import { PanelScrollable } from './Panel'
import { useColumns } from './useColumns'

const meta = {
  title: 'App/Layout/Column motion',
  parameters: { layout: 'fullscreen' },
  globals: { viewport: { value: 'desktop' } },
} satisfies Meta
export default meta
type Story = StoryObj

const columns = [
  { id: 'main', min: 400 },
  { id: 'aside', min: 280, max: 320, collapseOrder: 0 },
]

function Contents({ adaptive }: { adaptive: boolean }) {
  const { visible } = useColumns()
  const shown = visible.includes('aside')
  const [open, setOpen] = useState(true)
  const editor = (
    <>
      <input aria-label="Panel draft" defaultValue="Draft" />
      <div style={{ height: 1600 }}>Scrollable editor</div>
    </>
  )
  return (
    <Columns>
      <PanelScrollable>
        <input aria-label="Main draft" defaultValue="Main" />
      </PanelScrollable>
      {adaptive ? (
        <AdaptivePanel
          docked={shown}
          controller={{ open, setOpen }}
          label="Column editor"
        >
          {editor}
        </AdaptivePanel>
      ) : shown ? (
        <PanelScrollable>{editor}</PanelScrollable>
      ) : null}
    </Columns>
  )
}

function Harness({ adaptive = false }: { adaptive?: boolean }) {
  return (
    <div data-testid="resize-container" style={{ width: 800 }}>
      <Layout navigation={false} columns={columns}>
        <Contents adaptive={adaptive} />
      </Layout>
    </div>
  )
}

async function settle(element: HTMLElement) {
  await Promise.allSettled(
    element
      .getAnimations({ subtree: true })
      .map(animation => animation.finished)
  )
}

export const PresenceAndReversal: Story = {
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const container = canvas.getByTestId('resize-container')
    const root = container.querySelector<HTMLElement>('.layout-columns')!
    const [main, aside] = root.querySelectorAll<HTMLElement>('.layout-column')
    const surface = aside.querySelector<HTMLElement>('.layout-column-content')!
    const input = canvas.getByRole('textbox', { name: 'Panel draft' })
    await userEvent.type(input, ' in progress')
    await waitFor(() => expect(root).toHaveAttribute('data-animate'))
    await settle(root)
    container.style.width = '620px'
    await waitFor(() => expect(aside).toHaveAttribute('inert'))
    const animations = root.getAnimations({ subtree: true })
    expect(animations.length).toBeGreaterThan(0)
    for (const animation of animations) {
      animation.pause()
      animation.currentTime = Number(animation.effect!.getTiming().duration) / 2
    }
    const opacity = Number(getComputedStyle(surface).opacity)
    expect(opacity).toBeGreaterThan(0)
    expect(opacity).toBeLessThan(1)
    expect(input.isConnected).toBe(true)
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      expect(getComputedStyle(surface).transform).toBe('none')
      expect(main.getBoundingClientRect().width).toBe(612)
    } else {
      const scale = new DOMMatrix(getComputedStyle(surface).transform).a
      expect(scale).toBeGreaterThan(0.97)
      expect(scale).toBeLessThan(1)
      expect(main.getBoundingClientRect().width).toBeGreaterThan(400)
      expect(main.getBoundingClientRect().width).toBeLessThan(612)
    }
    // Reverse before exit completes: retain the same input and unfinished value.
    container.style.width = '800px'
    await waitFor(() => expect(aside).not.toHaveAttribute('inert'))
    for (const animation of root.getAnimations({ subtree: true }))
      animation.finish()
    await settle(root)
    expect(canvas.getByRole('textbox', { name: 'Panel draft' })).toBe(input)
    expect(input).toHaveValue('Draft in progress')
    expect(getComputedStyle(surface).opacity).toBe('1')
    expect(main.getBoundingClientRect().width).toBe(464)

    container.style.width = '620px'
    await waitFor(() => expect(aside).toHaveAttribute('inert'))
    await settle(root)
    await waitFor(() => expect(input.isConnected).toBe(false))
    expect(main.getBoundingClientRect().width).toBe(612)

    container.style.width = '800px'
    await waitFor(() => expect(aside).not.toHaveAttribute('inert'))
    const reentered = canvas.getByRole('textbox', { name: 'Panel draft' })
    expect(reentered).toHaveValue('Draft')
    for (const animation of root.getAnimations({ subtree: true })) {
      animation.pause()
      animation.currentTime = Number(animation.effect!.getTiming().duration) / 2
    }
    // Also reverse an entrance: its partially expanded surface stays readable.
    container.style.width = '620px'
    await waitFor(() => expect(aside).toHaveAttribute('inert'))
    expect(surface.offsetWidth).toBeGreaterThan(0)
    for (const animation of root.getAnimations({ subtree: true }))
      animation.finish()
    await settle(root)
    await waitFor(() => expect(reentered.isConnected).toBe(false))
    expect(main.getBoundingClientRect().width).toBe(612)
  },
}

export const PreserveEditorThroughExit: Story = {
  render: () => <Harness adaptive />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const container = canvas.getByTestId('resize-container')
    const root = container.querySelector<HTMLElement>('.layout-columns')!
    const input = canvas.getByRole('textbox', { name: 'Panel draft' })
    await userEvent.type(input, ' in progress')
    const viewport = input.closest<HTMLElement>('.kit-scroll-viewport')!
    viewport.scrollTop = 100
    await waitFor(() => expect(root).toHaveAttribute('data-animate'))
    await settle(root)
    container.style.width = '620px'
    const dialog = await body.findByRole('dialog', { name: 'Column editor' })
    expect(within(dialog).getByRole('textbox', { name: 'Panel draft' })).toBe(
      input
    )
    expect(input).toHaveValue('Draft in progress')
    await waitFor(() => expect(viewport.scrollTop).toBe(100))
    await waitFor(() => expect(input).toHaveFocus())
    container.style.width = '800px'
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
    await settle(root)
    expect(canvas.getByRole('textbox', { name: 'Panel draft' })).toBe(input)
    expect(input).toHaveValue('Draft in progress')
    expect(viewport.scrollTop).toBe(100)
    await waitFor(() => expect(input).toHaveFocus())
  },
}
