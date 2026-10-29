import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { ListDetailsSurface } from './ListDetailsSurface'

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
      <button onClick={() => setOpen(true)}>Open list</button>
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
      await page.viewport(600, 900)
      const details = await body.findByRole('dialog', {
        name: 'Selected details',
      })
      expect(within(details).getByRole('textbox', { name: 'Draft' })).toBe(
        input
      )
      expect(input).toHaveValue('Unfinished')
      await waitFor(() => expect(viewport.scrollTop).toBe(100))
      expect(input).toHaveFocus()
      await page.viewport(1200, 900)
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
