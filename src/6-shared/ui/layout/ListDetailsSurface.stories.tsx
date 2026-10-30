import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { ListDetailsSurface } from './ListDetailsSurface'
import { Panel } from './Panel'

const meta = {
  title: 'App/Layout/List details surface',
  parameters: { layout: 'fullscreen' },
} satisfies Meta
export default meta
type Story = StoryObj

function Harness() {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  return (
    <>
      <div className="layout-columns h-dvh">
        <div className="flex min-w-0 flex-1 [&>.layout-panel]:flex-1">
          <Panel>
            <button onClick={() => setOpen(true)}>Open list</button>
          </Panel>
        </div>
      </div>
      <ListDetailsSurface
        title="Transactions"
        controller={{
          open,
          setOpen: next => {
            setOpen(next)
            if (!next) setSelected(null)
          },
        }}
        details={{
          label: 'Selected details',
          controller: {
            open: selected !== null,
            setOpen: next => {
              if (!next) setSelected(null)
            },
          },
          children: (
            <Details selected={selected} close={() => setSelected(null)} />
          ),
        }}
      >
        <button onClick={() => setSelected('B')}>Transaction B</button>
        <button onClick={() => setSelected('C')}>Transaction C</button>
      </ListDetailsSurface>
    </>
  )
}

function Details({
  selected,
  close,
}: {
  selected: string | null
  close: () => void
}) {
  const [draft, setDraft] = useState('')
  return (
    <>
      <p>Selected: {selected}</p>
      <input
        aria-label="Draft"
        value={draft}
        onChange={event => setDraft(event.target.value)}
      />
      <button onClick={close}>Close details</button>
      <div style={{ height: 1600 }}>Long details</div>
    </>
  )
}

export const WidePair: Story = {
  tags: ['check'],
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    if (!('__vitest_browser_runner__' in window)) return
    const { page } = await import('vitest/browser')
    const original = { width: window.innerWidth, height: window.innerHeight }
    const body = within(canvasElement.ownerDocument.body)
    try {
      await page.viewport(1200, 900)
      await userEvent.click(
        within(canvasElement).getByRole('button', { name: 'Open list' })
      )
      const list = await body.findByRole('dialog', { name: 'Transactions' })
      await waitFor(() => expect(list).toBeVisible())
      await userEvent.click(
        within(list).getByRole('button', { name: 'Transaction B' })
      )
      const draft = await body.findByRole('textbox', { name: 'Draft' })
      await waitFor(() => expect(draft).toBeVisible())
      expect(body.getAllByRole('dialog')).toHaveLength(1)
      await userEvent.click(
        within(list).getByRole('button', { name: 'Transaction C' })
      )
      expect(body.getByText('Selected: C')).toBeVisible()
      await userEvent.tab()
      expect(draft).toHaveFocus()
      await userEvent.tab({ shift: true })
      expect(
        within(list).getByRole('button', { name: 'Transaction C' })
      ).toHaveFocus()
      await userEvent.keyboard('{Escape}')
      await waitFor(() =>
        expect(body.queryByRole('textbox', { name: 'Draft' })).toBeNull()
      )
      expect(list).toBeVisible()
      expect(
        within(list).getByRole('button', { name: 'Transaction C' })
      ).toHaveFocus()
      await userEvent.keyboard('{Escape}')
      await waitFor(() => expect(list).not.toBeInTheDocument())
    } finally {
      await page.viewport(original.width, original.height)
    }
  },
}

export const PanelGeometry: Story = {
  tags: ['check'],
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    if (!('__vitest_browser_runner__' in window)) return
    const { page } = await import('vitest/browser')
    const original = { width: window.innerWidth, height: window.innerHeight }
    const body = within(canvasElement.ownerDocument.body)
    try {
      await page.viewport(1200, 900)
      const reference = canvasElement.querySelector('.layout-panel')!
      await userEvent.click(
        within(canvasElement).getByRole('button', { name: 'Open list' })
      )
      const dialog = await body.findByRole('dialog', { name: 'Transactions' })
      const list = within(dialog).getByRole('region', { name: 'Transactions' })
      await waitFor(() => {
        const actual = list.getBoundingClientRect()
        const expected = reference.getBoundingClientRect()
        expect(actual.top).toBeCloseTo(expected.top, 0)
        expect(actual.bottom).toBeCloseTo(expected.bottom, 0)
        expect(actual.right).toBeCloseTo(expected.right, 0)
      })
      expect(getComputedStyle(list).backgroundColor).toBe(
        getComputedStyle(reference).backgroundColor
      )
      expect(getComputedStyle(dialog).backgroundColor).toBe('rgba(0, 0, 0, 0)')
      await userEvent.click(
        within(list).getByRole('button', { name: 'Transaction B' })
      )
      const details = await body.findByRole('region', {
        name: 'Selected details',
      })
      await waitFor(() => {
        const listBounds = list.getBoundingClientRect()
        const detailBounds = details.getBoundingClientRect()
        const expected = reference.getBoundingClientRect()
        expect(detailBounds.left - listBounds.right).toBeCloseTo(8, 0)
        expect(detailBounds.right).toBeCloseTo(expected.right, 0)
        expect(detailBounds.top).toBeCloseTo(expected.top, 0)
        expect(detailBounds.bottom).toBeCloseTo(expected.bottom, 0)
      })
      expect(getComputedStyle(list).borderRadius).toBe(
        getComputedStyle(reference).borderRadius
      )
      expect(getComputedStyle(details).borderRadius).toBe(
        getComputedStyle(reference).borderRadius
      )
    } finally {
      await page.viewport(original.width, original.height)
    }
  },
}

export const SynchronizedPanelMotion: Story = {
  tags: ['check'],
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    if (!('__vitest_browser_runner__' in window)) return
    const { page } = await import('vitest/browser')
    const original = { width: window.innerWidth, height: window.innerHeight }
    const body = within(canvasElement.ownerDocument.body)
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    try {
      await page.viewport(1200, 900)
      await userEvent.click(
        within(canvasElement).getByRole('button', { name: 'Open list' })
      )
      const dialog = await body.findByRole('dialog', { name: 'Transactions' })
      await waitFor(() => {
        expect(dialog.getBoundingClientRect().right).toBeCloseTo(
          window.innerWidth - 8,
          0
        )
        expect(dialog.getAnimations()).toHaveLength(0)
      })
      const list = within(dialog).getByRole('region', { name: 'Transactions' })
      const initialLeft = list.getBoundingClientRect().left
      await userEvent.click(
        within(list).getByRole('button', { name: 'Transaction B' })
      )
      const details = await body.findByRole('region', {
        name: 'Selected details',
      })
      const pauseHalfway = () => {
        const listAnimations = list.getAnimations()
        expect(listAnimations.length).toBe(reduced ? 0 : 1)
        const animations = [
          ...listAnimations,
          ...details.parentElement!.getAnimations({ subtree: true }),
        ]
        for (const animation of animations) {
          animation.pause()
          animation.currentTime =
            Number(animation.effect!.getTiming().duration) / 2
        }
        if (reduced)
          expect(details.getBoundingClientRect().right).toBeCloseTo(
            window.innerWidth - 8,
            0
          )
        return () => animations.forEach(animation => animation.finish())
      }
      const finishEnter = pauseHalfway()
      if (!reduced) {
        const bounds = list.getBoundingClientRect()
        expect(bounds.left).toBeLessThan(initialLeft)
        expect(bounds.left).toBeGreaterThan(initialLeft - 368)
        expect(details.getBoundingClientRect().left - bounds.right).toBeCloseTo(
          8,
          0
        )
      }
      finishEnter()
      await waitFor(() =>
        expect(list.getBoundingClientRect().left).toBeCloseTo(
          initialLeft - 368,
          0
        )
      )
      await userEvent.click(
        within(details).getByRole('button', { name: 'Close details' })
      )
      const finishExit = pauseHalfway()
      expect(details.isConnected).toBe(true)
      if (!reduced) {
        const bounds = list.getBoundingClientRect()
        expect(bounds.left).toBeLessThan(initialLeft)
        expect(bounds.left).toBeGreaterThan(initialLeft - 368)
        expect(details.getBoundingClientRect().left - bounds.right).toBeCloseTo(
          8,
          0
        )
      }
      finishExit()
      await waitFor(() =>
        expect(body.queryByRole('textbox', { name: 'Draft' })).toBeNull()
      )
      expect(list.getBoundingClientRect().left).toBeCloseTo(initialLeft, 0)
    } finally {
      await page.viewport(original.width, original.height)
    }
  },
}

const narrowLayers =
  (width: number): Story['play'] =>
  async ({ canvasElement }) => {
    if (!('__vitest_browser_runner__' in window)) return
    const { page } = await import('vitest/browser')
    const original = { width: window.innerWidth, height: window.innerHeight }
    const body = within(canvasElement.ownerDocument.body)
    try {
      await page.viewport(width, 900)
      await userEvent.click(
        within(canvasElement).getByRole('button', { name: 'Open list' })
      )
      const list = await body.findByRole('dialog', { name: 'Transactions' })
      await waitFor(() => expect(list).toBeVisible())
      const row = within(list).getByRole('button', { name: 'Transaction B' })
      await userEvent.click(row)
      const details = await body.findByRole('dialog', {
        name: 'Selected details',
      })
      await waitFor(() => expect(details).toBeVisible())
      expect(body.queryByRole('dialog', { name: 'Transactions' })).toBeNull()
      await userEvent.keyboard('{Escape}')
      await waitFor(() => expect(details).not.toBeInTheDocument())
      expect(list).toBeVisible()
      await waitFor(() => expect(row).toHaveFocus())
      await userEvent.keyboard('{Escape}')
      await waitFor(() => expect(list).not.toBeInTheDocument())
    } finally {
      await page.viewport(original.width, original.height)
    }
  }

export const NarrowLayers: Story = {
  tags: ['check'],
  render: () => <Harness />,
  play: narrowLayers(600),
}

export const MobileLayers: Story = { ...NarrowLayers, play: narrowLayers(390) }

export const CloseListWithDetails: Story = {
  tags: ['check'],
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    if (!('__vitest_browser_runner__' in window)) return
    const { page } = await import('vitest/browser')
    const original = { width: window.innerWidth, height: window.innerHeight }
    const body = within(canvasElement.ownerDocument.body)
    try {
      await page.viewport(1200, 900)
      await userEvent.click(
        within(canvasElement).getByRole('button', { name: 'Open list' })
      )
      const list = await body.findByRole('dialog', { name: 'Transactions' })
      await waitFor(() => expect(list).toBeVisible())
      await userEvent.click(
        within(list).getByRole('button', { name: 'Transaction B' })
      )
      await body.findByRole('textbox', { name: 'Draft' })
      await userEvent.click(
        within(body.getByRole('region', { name: 'Transactions' })).getByRole(
          'button',
          { name: 'Close' }
        )
      )
      await waitFor(() => expect(list).not.toBeInTheDocument())
      expect(body.queryByRole('textbox', { name: 'Draft' })).toBeNull()
      expect(
        within(canvasElement).getByRole('button', { name: 'Open list' })
      ).toHaveFocus()
    } finally {
      await page.viewport(original.width, original.height)
    }
  },
}

export const PreserveAcrossResize: Story = {
  tags: ['check'],
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    if (!('__vitest_browser_runner__' in window)) return
    const { page } = await import('vitest/browser')
    const original = { width: window.innerWidth, height: window.innerHeight }
    const body = within(canvasElement.ownerDocument.body)
    try {
      await page.viewport(1200, 900)
      await userEvent.click(
        within(canvasElement).getByRole('button', { name: 'Open list' })
      )
      const list = await body.findByRole('dialog', { name: 'Transactions' })
      await waitFor(() => expect(list).toBeVisible())
      await userEvent.click(
        within(list).getByRole('button', { name: 'Transaction B' })
      )
      const input = await body.findByRole('textbox', { name: 'Draft' })
      await userEvent.type(input, 'Unfinished')
      const viewport = input.closest<HTMLElement>('.kit-scroll-viewport')!
      viewport.scrollTop = 100
      await waitFor(() => expect(viewport.scrollTop).toBe(100))
      await page.viewport(783, 900)
      const details = await body.findByRole('dialog', {
        name: 'Selected details',
      })
      expect(within(details).getByRole('textbox', { name: 'Draft' })).toBe(
        input
      )
      expect(input).toHaveValue('Unfinished')
      await waitFor(() => expect(viewport.scrollTop).toBe(100))
      expect(input).toHaveFocus()
      await page.viewport(784, 900)
      await waitFor(() =>
        expect(
          body.queryByRole('dialog', { name: 'Selected details' })
        ).toBeNull()
      )
      expect(body.getByRole('textbox', { name: 'Draft' })).toBe(input)
      expect(input).toHaveValue('Unfinished')
      await waitFor(() => expect(viewport.scrollTop).toBe(100))
      expect(input).toHaveFocus()
    } finally {
      await page.viewport(original.width, original.height)
    }
  },
}

export const PreserveWithoutMoveBefore: Story = {
  ...PreserveAcrossResize,
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
      await PreserveAcrossResize.play!(context)
    } finally {
      if (descriptor)
        Object.defineProperty(Element.prototype, 'moveBefore', descriptor)
      else Reflect.deleteProperty(Element.prototype, 'moveBefore')
    }
  },
}
