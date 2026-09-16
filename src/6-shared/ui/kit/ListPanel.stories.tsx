import { useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Popover } from '@base-ui/react/popover'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { ListPanel } from './ListPanel'
import { ListRow, ListRowHeader, ListRowSeparator } from './ListRow'
import { Input } from './Input'
import { Button } from './Button'
import { useListPanelPositioning } from './useListPanelPositioning'

const accounts = Array.from(
  { length: 100 },
  (_, i) => `Account ${String(i + 1).padStart(3, '0')}`
)
const meta = {
  title: 'UI Kit/Building blocks/List panel',
  component: ListPanel,
  tags: ['autodocs'],
  parameters: {
    controls: { disable: true },
    layout: 'padded',
    docs: {
      description: {
        component: `A list surface with a fixed header, edge fades and one scrollbar-free scrollport. Actions follow the list inside the same scrollport.

- Compose with a Base UI Popup through **render**; focus and list semantics belong to the owner.
- Set **preserveHeight** while filtering to freeze the previous height, including for an empty result. Clear it for natural sizing or explicit expansion. Unmount between openings to reset.
- Put an empty result in **empty**, not in the children: a listbox scrollport holds options, so a message inside it would be orphan text.
- **useListPanelPositioning** supplies visible-viewport bounds to Base UI. It does not position anything itself. Override width for field-aligned or custom triggers.
- The viewport slider below simulates less available space; it is not a real mobile-keyboard test.`,
      },
    },
  },
} satisfies Meta<typeof ListPanel>
export default meta
type Story = StoryObj<typeof meta>

export const Showcase: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-8 bg-ui-base p-8">
      <section>
        <h2 className="mb-3 text-ui-20 text-ui-primary">Short list</h2>
        <ListPanel>
          <ListRowHeader>Visibility</ListRowHeader>
          <ListRow selected>Automatic</ListRow>
          <ListRow>Visible</ListRow>
          <ListRow>Hidden</ListRow>
        </ListPanel>
      </section>
      <section>
        <h2 className="mb-3 text-ui-20 text-ui-primary">
          Long list · scroll the surface
        </h2>
        <ListPanel
          style={{ maxHeight: 360 }}
          header={
            <Input
              label="Preview search"
              placeholder="Search accounts"
              readOnly
            />
          }
          actions={
            <ListRow render={<button type="button" />}>Show more</ListRow>
          }
        >
          <ListRowHeader>Accounts</ListRowHeader>
          <ul>
            {accounts.slice(0, 20).map((name, i) => (
              <ListRow
                key={name}
                render={<li />}
                selected={i === 2}
                description={
                  i === 3
                    ? 'A longer explanatory line that wraps inside a narrow panel.'
                    : undefined
                }
              >
                {name}
              </ListRow>
            ))}
          </ul>
          <ListRowSeparator />
        </ListPanel>
      </section>
    </div>
  ),
}

function FilteringDemo() {
  const positioning = useListPanelPositioning()
  const [loss, setLoss] = useState(0)
  const [offset, setOffset] = useState(120)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(8)
  const search = useRef<HTMLInputElement>(null)
  const matches = query
    ? accounts.filter(name => name.toLowerCase().includes(query.toLowerCase()))
    : accounts.slice(0, limit)
  const boundary = positioning.collisionBoundary
  return (
    <div className="text-ui-primary">
      <p className="mb-4 max-w-xl text-ui-14 text-ui-secondary">
        Open, filter down to one or zero results, then clear the query. The
        panel keeps its size. Reduce available space to check that viewport
        constraints still win.
      </p>
      <label className="mr-6 inline-flex items-center gap-3">
        Simulated viewport reduction
        <input
          aria-label="Simulated viewport reduction"
          type="range"
          min="0"
          max="400"
          value={loss}
          onChange={e => setLoss(+e.target.value)}
        />
      </label>
      <label className="inline-flex items-center gap-3">
        Trigger position
        <input
          aria-label="Trigger position"
          type="range"
          min="0"
          max="500"
          value={offset}
          onChange={e => setOffset(+e.target.value)}
        />
      </label>
      <div style={{ marginTop: offset }}>
        <Popover.Root
          open={open}
          onOpenChange={next => {
            setOpen(next)
            if (!next) {
              setQuery('')
              setLimit(8)
            }
          }}
        >
          <Popover.Trigger render={<Button variant="secondary" />}>
            Browse accounts
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner
              {...positioning}
              collisionBoundary={
                boundary
                  ? {
                      ...boundary,
                      height: Math.max(80, boundary.height - loss),
                    }
                  : undefined
              }
              className="z-modal"
            >
              <Popover.Popup
                initialFocus={search}
                aria-label="Accounts panel"
                render={
                  <ListPanel
                    data-testid="accounts-panel"
                    preserveHeight={query.length > 0}
                    header={
                      <Input
                        ref={search}
                        label="Search accounts"
                        placeholder="Search accounts"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                      />
                    }
                    actions={
                      !query && limit < accounts.length ? (
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => {
                            setLimit(n => Math.min(n + 20, accounts.length))
                            search.current?.focus({ preventScroll: true })
                          }}
                        >
                          Show more
                        </Button>
                      ) : undefined
                    }
                    empty={
                      matches.length ? undefined : (
                        <p
                          role="status"
                          className="px-4 py-3 text-ui-14 text-ui-secondary"
                        >
                          No matching accounts
                        </p>
                      )
                    }
                  />
                }
              >
                <ul aria-label="Accounts">
                  {matches.map(name => (
                    <ListRow render={<li />} key={name}>
                      {name}
                    </ListRow>
                  ))}
                </ul>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </div>
    </div>
  )
}

export const Playground: Story = { render: () => <FilteringDemo /> }

export const Filtering: Story = {
  render: () => <FilteringDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      canvas.getByRole('button', { name: 'Browse accounts' })
    )
    const input = await body.findByRole('textbox', { name: 'Search accounts' })
    const panel = body.getByTestId('accounts-panel')
    // Compare behavior, not a prescribed height: filtering must not move the panel.
    await waitFor(() =>
      expect(panel.getBoundingClientRect().height).toBeGreaterThan(100)
    )
    await userEvent.click(input)
    await new Promise<void>(resolve =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    )
    const initial = panel.getBoundingClientRect()
    await userEvent.type(input, 'Account 099')
    await expect(
      body.getByRole('list', { name: 'Accounts' }).children
    ).toHaveLength(1)
    await waitFor(() =>
      expect(
        Math.abs(panel.getBoundingClientRect().height - initial.height)
      ).toBeLessThan(1)
    )
    await expect(
      Math.abs(panel.getBoundingClientRect().top - initial.top)
    ).toBeLessThan(1)
    await userEvent.type(input, 'xyz')
    await expect(body.getByRole('status')).toHaveTextContent(
      'No matching accounts'
    )
    await expect(
      Math.abs(panel.getBoundingClientRect().height - initial.height)
    ).toBeLessThan(1)
    await userEvent.clear(input)
    const more = body.getByRole('button', { name: 'Show more' })
    await userEvent.tab()
    await expect(more).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect(input).toHaveFocus()
    await expect(
      body.getByRole('list', { name: 'Accounts' }).children
    ).toHaveLength(28)
    await userEvent.keyboard('{Escape}')
    await waitFor(() =>
      expect(
        canvas.getByRole('button', { name: 'Browse accounts' })
      ).toHaveFocus()
    )
  },
}
