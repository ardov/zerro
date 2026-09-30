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
      <output aria-label="Filter query" className="sr-only">
        {JSON.stringify(query)}
      </output>
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    for (const name of ['Only New', 'Show Deleted']) {
      const chip = canvas.getByRole('button', { name })
      await userEvent.click(chip)
      await expect(chip).toBeInTheDocument()
      await userEvent.keyboard('{Enter}{Space}')
      expect(readQuery(canvasElement).clauses).toHaveLength(2)
    }
    await userEvent.click(
      canvas.getByRole('button', { name: 'Remove Only New' })
    )
    expect(readQuery(canvasElement).clauses).toEqual([
      { kind: 'deleted', mode: 'include' },
    ])
  },
}

export const ChipRemoval: Story = {
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
    const canvas = within(canvasElement)
    const first = canvas.getByRole('combobox', { name: 'Cash USD' })
    const second = canvas.getByRole('combobox', { name: 'Food' })
    first.focus()
    await userEvent.keyboard('{Delete}')
    await waitFor(() => expect(first).not.toBeInTheDocument())
    await expect(second).toHaveFocus()
    await userEvent.click(canvas.getByRole('button', { name: 'Remove Food' }))
    await waitFor(() => expect(second).not.toBeInTheDocument())
    await expect(
      within(canvasElement).getByRole('button', { name: 'Add filter' })
    ).toHaveFocus()
  },
}

function readQuery(canvasElement: HTMLElement) {
  return JSON.parse(
    within(canvasElement).getByLabelText('Filter query').textContent || '{}'
  )
}

export const DirectCategorySelection: Story = {
  render: () => <FilterHarness />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await step('Add opens the category list directly', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Add filter' }))
      await userEvent.click(
        await body.findByRole('menuitem', { name: 'Category' })
      )
      await expect(
        await body.findByRole('combobox', { name: 'Select category' })
      ).toHaveFocus()
      await expect(body.getAllByRole('listbox')).toHaveLength(1)
      // The modal search is the only exposed combobox while its popup is open.
      await expect(body.getAllByRole('combobox')).toHaveLength(1)
    })
    await step(
      'Selection applies immediately and survives closing',
      async () => {
        await userEvent.click(body.getByRole('option', { name: 'Food' }))
        await userEvent.click(body.getByRole('option', { name: 'No Category' }))
        expect(readQuery(canvasElement).clauses).toEqual([
          { kind: 'tag', ids: ['Food', 'null'] },
        ])
        await userEvent.keyboard('{Escape}')
        await waitFor(() =>
          expect(body.queryByRole('listbox')).not.toBeInTheDocument()
        )
        const chip = canvas.getByRole('combobox', { name: /Food/ })
        await waitFor(() => expect(chip).toHaveFocus())
        await userEvent.click(chip)
        await expect(
          await body.findByRole('option', { name: 'Food' })
        ).toHaveAttribute('aria-selected', 'true')
        await expect(
          body.getByRole('option', { name: 'No Category' })
        ).toHaveAttribute('aria-selected', 'true')
      }
    )
  },
}

export const CategorySearch: Story = {
  render: () => (
    <FilterHarness
      initialQuery={{ clauses: [{ kind: 'tag', ids: ['Food'] }] }}
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('combobox', { name: 'Food' }))
    await step('Search retains the parent as context', async () => {
      await userEvent.type(
        await body.findByRole('combobox', { name: 'Select category' }),
        'Groceries'
      )
      await expect(body.getByRole('option', { name: 'Food' })).toHaveAttribute(
        'aria-selected',
        'true'
      )
      await expect(
        body.getByRole('option', { name: 'Groceries' })
      ).toHaveAttribute('aria-selected', 'false')
    })
    await step('Parent and child toggle independently', async () => {
      await userEvent.click(body.getByRole('option', { name: 'Groceries' }))
      await userEvent.click(body.getByRole('option', { name: 'Food' }))
      await expect(
        body.getByRole('option', { name: 'Groceries' })
      ).toHaveAttribute('aria-selected', 'true')
      await expect(body.getByRole('option', { name: 'Food' })).toHaveAttribute(
        'aria-selected',
        'false'
      )
    })
  },
}

export const EmptyCategoryCleanup: Story = {
  render: () => (
    <FilterHarness
      initialQuery={{ clauses: [{ kind: 'tag', ids: ['Food'] }] }}
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('combobox', { name: 'Food' }))
    await step('Empty selection retains its open popup', async () => {
      await userEvent.click(await body.findByRole('option', { name: 'Food' }))
      expect(readQuery(canvasElement).clauses).toEqual([
        { kind: 'tag', ids: [] },
      ])
      await expect(body.getByRole('listbox')).toBeVisible()
    })
    await step(
      'Closing removes the empty filter and restores focus',
      async () => {
        await userEvent.keyboard('{Escape}')
        await waitFor(() =>
          expect(readQuery(canvasElement).clauses).toEqual([])
        )
        await expect(
          canvas.getByRole('button', { name: 'Add filter' })
        ).toHaveFocus()
      }
    )
  },
}

export const EmptyAccountCleanup: Story = {
  render: () => (
    <FilterHarness
      initialQuery={{ clauses: [{ kind: 'account', ids: ['Cash USD'] }] }}
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('combobox', { name: 'Cash USD' }))
    await step('Clear the account selection', async () => {
      await userEvent.click(
        await body.findByRole('option', { name: /^Cash USD/ })
      )
      expect(readQuery(canvasElement).clauses).toEqual([
        { kind: 'account', ids: [] },
      ])
    })
    await step(
      'Closing the editor removes its empty chip and restores focus',
      async () => {
        await userEvent.keyboard('{Escape}')
        await waitFor(() =>
          expect(body.queryByRole('listbox')).not.toBeInTheDocument()
        )
        await waitFor(() =>
          expect(readQuery(canvasElement).clauses).toEqual([])
        )
        await expect(
          canvas.getByRole('button', { name: 'Add filter' })
        ).toHaveFocus()
      }
    )
  },
}

export const DirectTypeSelection: Story = {
  render: () => <FilterHarness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Add filter' }))
    await userEvent.click(
      await body.findByRole('menuitem', { name: 'Type of Transaction' })
    )
    await userEvent.click(await body.findByRole('option', { name: 'Income' }))
    await userEvent.click(body.getByRole('option', { name: 'Expense' }))
    expect(readQuery(canvasElement).clauses[0].values).toHaveLength(2)
    await userEvent.keyboard('{Escape}')
    await waitFor(() =>
      expect(body.queryByRole('listbox')).not.toBeInTheDocument()
    )
    await expect(canvas.getByRole('combobox', { name: /Income/ })).toHaveFocus()
  },
}

export const AmountRange: Story = {
  render: () => <FilterHarness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Add filter' }))
    await userEvent.click(await body.findByText('Amount', { exact: true }))
    const from = await body.findByRole('spinbutton', { name: 'Amount from' })
    await userEvent.type(from, '100')
    await userEvent.type(
      body.getByRole('spinbutton', { name: 'Amount up to' }),
      '500'
    )
    await userEvent.keyboard('{Escape}')
    await waitFor(() =>
      expect(body.queryByRole('dialog')).not.toBeInTheDocument()
    )
    expect(readQuery(canvasElement).clauses).toEqual([
      { kind: 'amount', gte: 100, lte: 500 },
    ])
    const chip = canvas.getByRole('button', { name: 'Amount: 100–500' })
    await waitFor(() => expect(chip).toHaveFocus())
    await userEvent.click(chip)
    await userEvent.clear(
      await body.findByRole('spinbutton', { name: 'Amount from' })
    )
    await userEvent.clear(
      body.getByRole('spinbutton', { name: 'Amount up to' })
    )
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(readQuery(canvasElement).clauses).toEqual([]))
    await expect(
      canvas.getByRole('button', { name: 'Add filter' })
    ).toHaveFocus()
  },
}

export const MobileAmountRange: Story = {
  ...AmountRange,
  globals: { viewport: { value: 'zerro499' } },
}
