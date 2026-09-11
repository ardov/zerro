import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { core } from '@/zerro-core/redux'
import Filter from './Filter'

const meta = {
  title: 'App/Transactions/Filter',
  component: Filter,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    app: { scenario: 'demo', route: '/transactions' },
  },
} satisfies Meta<typeof Filter>

export default meta
type Story = StoryObj

function FilterHarness(props: {
  initialQuery?: core.transactions.TTransactionQuery
}) {
  const [query, setQuery] = useState<core.transactions.TTransactionQuery>(
    props.initialQuery || { clauses: [] }
  )
  const [search, setSearch] = useState('')
  return (
    <div className="w-[560px] max-w-[95vw]">
      <Filter
        query={query}
        onQueryChange={setQuery}
        search={search}
        onSearchChange={setSearch}
      />
    </div>
  )
}

export const Empty: Story = { render: () => <FilterHarness /> }

export const SearchAndFilters: Story = {
  render: () => (
    <FilterHarness
      initialQuery={{
        clauses: [
          { kind: 'account', ids: ['Cash USD', 'Cash RUB', 'Cash EUR'] },
          { kind: 'tag', ids: ['Food', 'Transportation'] },
          { kind: 'type', values: [core.transactions.TrFilterType.Outcome] },
          { kind: 'amount', gte: 100, lte: 5000 },
        ],
      }}
    />
  ),
}

export const Flags: Story = {
  render: () => (
    <FilterHarness
      initialQuery={{
        clauses: [
          { kind: 'viewed', value: false },
          { kind: 'deleted', mode: 'include' },
        ],
      }}
    />
  ),
}

export const KeyboardRemoval: Story = {
  render: () => (
    <FilterHarness
      initialQuery={{
        clauses: [
          { kind: 'account', ids: ['Cash USD'] },
          { kind: 'tag', ids: ['Food'] },
        ],
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const chipButtons = () =>
      Array.from(
        canvasElement.querySelectorAll<HTMLButtonElement>(
          '[data-slot="chip-label"]'
        )
      )
    const [first, second] = chipButtons()
    first.focus()
    await userEvent.keyboard('{Delete}')
    await waitFor(() => expect(first).not.toBeInTheDocument())
    await expect(second).toHaveFocus()
    await userEvent.keyboard('{Delete}')
    await waitFor(() => expect(second).not.toBeInTheDocument())
    await expect(
      within(canvasElement).getByRole('button', { name: 'Add filter' })
    ).toHaveFocus()
  },
}
