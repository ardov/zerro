import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { useMediaQueryValue } from '@/6-shared/hooks/useMediaQueryValue'
import { AdaptivePanel } from './AdaptivePanel'

const meta = {
  title: 'App/Layout/Adaptive panel',
  parameters: { layout: 'fullscreen' },
} satisfies Meta
export default meta
type Story = StoryObj

function Editor({ close }: { close: () => void }) {
  const [value, setValue] = useState('')
  return (
    <>
      <input
        aria-label="Draft"
        value={value}
        onChange={event => setValue(event.target.value)}
      />
      <button onClick={close}>Finish editing</button>
      <div style={{ height: 1600 }}>Long editor content</div>
    </>
  )
}

function Harness() {
  const docked = useMediaQueryValue('(min-width: 1000px)')
  const [open, setOpen] = useState(true)
  return (
    <div className="flex h-[600px] w-[360px]">
      <AdaptivePanel
        docked={docked}
        controller={{ open, setOpen }}
        label="Adaptive editor"
      >
        <Editor close={() => setOpen(false)} />
      </AdaptivePanel>
    </div>
  )
}

/** A titled drawer: its first focus lands in the header, outside the scroll. */
function TitledHarness() {
  const [open, setOpen] = useState(true)
  return (
    <>
      <button onClick={() => setOpen(true)}>Open overview</button>
      <AdaptivePanel
        docked={false}
        controller={{ open, setOpen }}
        title="Overview"
      >
        <div style={{ height: 1600 }}>Long overview</div>
      </AdaptivePanel>
    </>
  )
}

const nextFrame = () => new Promise(requestAnimationFrame)

export const PreserveScrollAndDraft: Story = {
  tags: ['check'],
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    if (!('__vitest_browser_runner__' in window)) return
    const { page } = await import('vitest/browser')
    const body = within(canvasElement.ownerDocument.body)
    const original = { width: window.innerWidth, height: window.innerHeight }
    try {
      await page.viewport(1200, 900)
      await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
      const input = within(canvasElement).getByRole('textbox', {
        name: 'Draft',
      })
      await userEvent.type(input, 'Unfinished')
      const viewport = input.closest<HTMLElement>('.kit-scroll-viewport')!
      viewport.scrollTop = 100
      await waitFor(() => expect(viewport.scrollTop).toBe(100))
      await page.viewport(900, 900)
      const dialog = await body.findByRole('dialog', {
        name: 'Adaptive editor',
      })
      expect(within(dialog).getByRole('textbox', { name: 'Draft' })).toBe(input)
      expect(input).toHaveValue('Unfinished')
      await waitFor(() => expect(viewport.scrollTop).toBe(100))
      expect(input).toHaveFocus()
      await page.viewport(1200, 900)
      await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
      expect(
        within(canvasElement).getByRole('textbox', { name: 'Draft' })
      ).toBe(input)
      expect(viewport.scrollTop).toBe(100)
      expect(input).toHaveFocus()
    } finally {
      await page.viewport(original.width, original.height)
    }
  },
}

export const PreserveWithoutStatePreservingMove: Story = {
  ...PreserveScrollAndDraft,
  play: async context => {
    const descriptor = Object.getOwnPropertyDescriptor(
      Element.prototype,
      'moveBefore'
    )
    Object.defineProperty(Element.prototype, 'moveBefore', {
      value: undefined,
      configurable: true,
    })
    try {
      await PreserveScrollAndDraft.play!(context)
    } finally {
      if (descriptor)
        Object.defineProperty(Element.prototype, 'moveBefore', descriptor)
      else Reflect.deleteProperty(Element.prototype, 'moveBefore')
    }
  },
}

export const ClosingContent: Story = {
  globals: { viewport: { value: 'iphone13' } },
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    const dialog = await body.findByRole('dialog', { name: 'Adaptive editor' })
    const input = within(dialog).getByRole('textbox', { name: 'Draft' })
    await userEvent.type(input, 'Closing draft')
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Finish editing' })
    )
    expect(dialog).toHaveAttribute('data-ending-style')
    expect(within(dialog).getByRole('textbox', { name: 'Draft' })).toHaveValue(
      'Closing draft'
    )
    await waitFor(() => expect(dialog.isConnected).toBe(false))
  },
}

export const ReopenStartsAtTop: Story = {
  globals: { viewport: { value: 'iphone13' } },
  render: () => <TitledHarness />,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    const first = await body.findByRole('dialog', { name: 'Overview' })
    const viewport = first.querySelector<HTMLElement>('.kit-scroll-viewport')!
    await nextFrame()
    viewport.scrollTop = 300
    await waitFor(() => expect(viewport.scrollTop).toBe(300))
    await nextFrame()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(first.isConnected).toBe(false))
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Open overview' })
    )
    const second = await body.findByRole('dialog', { name: 'Overview' })
    const reopened = second.querySelector<HTMLElement>('.kit-scroll-viewport')!
    for (let frame = 0; frame < 10; frame++) {
      expect(reopened.scrollTop).toBe(0)
      await nextFrame()
    }
  },
}
