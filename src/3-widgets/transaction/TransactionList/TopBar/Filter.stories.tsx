import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import {
  expect,
  fireEvent,
  fn,
  userEvent,
  waitFor,
  within,
} from 'storybook/test'
import { formatDate } from '@/6-shared/helpers/date'
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
  initialSearch?: string
  width?: number
  onQueryChange?: (query: core.transactions.TTransactionQuery) => void
}) {
  const [query, setQuery] = useState<core.transactions.TTransactionQuery>(
    props.initialQuery || { clauses: [] }
  )
  const [search, setSearch] = useState(props.initialSearch ?? '')
  return (
    <div style={{ width: props.width ?? 560 }} className="max-w-[95vw]">
      <Filter
        query={query}
        onQueryChange={next => {
          props.onQueryChange?.(next)
          setQuery(next)
        }}
        search={search}
        onSearchChange={setSearch}
      />
      <output aria-label="Filter query" className="sr-only">
        {JSON.stringify(query)}
      </output>
      <output aria-label="Search query" className="sr-only">
        {search}
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

export const InlineSearch: Story = {
  render: () => <FilterHarness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('textbox')).toBeNull()
    const add = canvas.getByRole('button', { name: 'Add filter' })
    await expect(add).toHaveTextContent('Add filter')
    await userEvent.click(
      canvas.getByRole('button', { name: 'Search transactions' })
    )
    let input = canvas.getByRole('textbox', { name: 'Search transactions' })
    await expect(input).toHaveFocus()
    await userEvent.type(input, 'Lidl groceries 12,00')
    await expect(canvas.getByLabelText('Search query')).toHaveTextContent(
      'Lidl groceries 12,00'
    )
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true })
    await expect(input).toBeInTheDocument()
    await userEvent.keyboard('{Enter}')
    let chip = canvas.getByRole('button', { name: 'Lidl groceries 12,00' })
    await waitFor(() => expect(chip).toHaveFocus())
    await expect(
      canvas.getByRole('button', { name: 'Add filter' })
    ).not.toHaveTextContent('Add filter')
    await userEvent.click(chip)
    input = canvas.getByRole('textbox', { name: 'Search transactions' })
    await userEvent.type(input, ' lunch')
    await userEvent.keyboard('{Escape}')
    chip = canvas.getByRole('button', { name: 'Lidl groceries 12,00 lunch' })
    await waitFor(() => expect(chip).toHaveFocus())
    await userEvent.keyboard('{Delete}')
    await expect(
      canvas.getByRole('button', { name: 'Search transactions' })
    ).toBeInTheDocument()
    await expect(
      canvas.getByRole('button', { name: 'Add filter' })
    ).toHaveTextContent('Add filter')
  },
}

export const DateRange: Story = {
  render: () => <FilterHarness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Add filter' }))
    await userEvent.click(await body.findByText('Date', { exact: true }))
    const from = await body.findByLabelText('Date From'),
      to = body.getByLabelText('Date To')
    fireEvent.change(from, { target: { value: '2026-10-20' } })
    await waitFor(() =>
      expect(readQuery(canvasElement).clauses).toEqual([
        { kind: 'date', from: '2026-10-20' },
      ])
    )
    fireEvent.change(to, { target: { value: '2026-10-05' } })
    await waitFor(() =>
      expect(readQuery(canvasElement).clauses).toEqual([
        { kind: 'date', from: '2026-10-05', to: '2026-10-20' },
      ])
    )
    await expect(from).toHaveValue('2026-10-20')
    await expect(to).toHaveValue('2026-10-05')
    await expect(
      canvas.getByText(
        `5–20 Oct${new Date().getFullYear() === 2026 ? '' : ' 2026'}`
      )
    ).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
    await userEvent.click(
      canvas.getByRole('button', {
        name: `5–20 Oct${new Date().getFullYear() === 2026 ? '' : ' 2026'}`,
      })
    )
    await expect(await body.findByLabelText('Date From')).toHaveValue(
      '2026-10-05'
    )
    await expect(body.getByLabelText('Date To')).toHaveValue('2026-10-20')
    fireEvent.change(body.getByLabelText('Date From'), {
      target: { value: '' },
    })
    fireEvent.change(body.getByLabelText('Date To'), { target: { value: '' } })
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(readQuery(canvasElement).clauses).toEqual([]))
    await expect(
      canvas.getByRole('button', { name: 'Add filter' })
    ).toHaveFocus()
  },
}

export const MobileDateRange: Story = {
  ...DateRange,
  globals: { viewport: { value: 'zerro499' } },
}

export const DateCalendar: Story = {
  render: () => (
    <FilterHarness
      initialQuery={{ clauses: [{ kind: 'date', from: '2026-10-20' }] }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      canvas.getByRole('button', {
        name: `From 20 Oct${new Date().getFullYear() === 2026 ? '' : ' 2026'}`,
      })
    )
    const field = await body.findByLabelText('Date From')
    await expect(field).toHaveValue('2026-10-20')
    const trigger = body.getByRole('button', { name: 'Select date: Date From' })
    await userEvent.click(trigger)
    const calendar = await body.findByRole('dialog', {
      name: 'Select date: Date From',
    })
    await userEvent.click(
      within(calendar).getByRole('button', {
        name: formatDate('2026-10-05', 'PPPP'),
      })
    )
    await waitFor(() => expect(calendar).not.toBeInTheDocument())
    await expect(field).toHaveValue('2026-10-05')
    await expect(trigger).toHaveFocus()
    await expect(body.getByLabelText('Date To')).toHaveValue('')
    await userEvent.keyboard('{Escape}')
  },
}

export const MobileDateCalendar: Story = {
  ...DateCalendar,
  globals: { viewport: { value: 'zerro499' } },
}

export const MerchantSelection: Story = {
  render: () => (
    <FilterHarness
      initialSearch="lunch"
      initialQuery={{ clauses: [{ kind: 'account', ids: ['Cash USD'] }] }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Add filter' }))
    await userEvent.click(
      await body.findByRole('menuitem', { name: 'Merchant' })
    )
    const input = await body.findByRole('combobox', { name: 'Find merchant' })
    await expect(input).toHaveFocus()
    const merchant = body
      .getAllByRole('option')
      .find(option => option.textContent !== 'No merchant')!
    const name = merchant.textContent!
    await userEvent.click(merchant)
    await userEvent.click(body.getByRole('option', { name: 'No merchant' }))
    await userEvent.type(input, name)
    await expect(body.getByRole('option', { name })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(body.queryByRole('listbox')).toBeNull())
    const query = readQuery(canvasElement)
    expect(
      query.clauses.map((clause: { kind: string }) => clause.kind)
    ).toEqual(['account', 'merchant'])
    expect(query.clauses[1].ids).toHaveLength(2)
    expect(query.clauses[1].ids).toContain(null)
    await expect(canvas.getByLabelText('Search query')).toHaveTextContent(
      'lunch'
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Add filter' }))
    await body.findByRole('menu')
    await expect(body.queryByRole('menuitem', { name: 'Merchant' })).toBeNull()
    await userEvent.keyboard('{Escape}')
  },
}

export const NarrowWrapping: Story = {
  render: () => (
    <FilterHarness
      width={320}
      initialSearch="A very long search across comments categories merchants and accounts"
      initialQuery={{
        clauses: [
          { kind: 'account', ids: ['Cash USD', 'Cash RUB', 'Cash EUR'] },
          { kind: 'amount', gte: 12 },
        ],
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const search = canvas.getByRole('button', { name: /^A very long search/ })
    await waitFor(() =>
      expect(search.querySelector('[data-overflow]')).not.toBeNull()
    )
    const add = canvas.getByRole('button', { name: 'Add filter' })
    const last = canvas.getByRole('button', { name: 'Amount from 12' })
    await waitFor(() =>
      expect(
        Math.abs(
          last.getBoundingClientRect().top - add.getBoundingClientRect().top
        )
      ).toBeLessThan(2)
    )
    await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(
      canvasElement.clientWidth
    )
    await userEvent.click(search)
    const input = canvas.getByRole('textbox', { name: 'Search transactions' })
    await expect(input).toHaveFocus()
    await userEvent.type(input, ' more words')
    await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(
      canvasElement.clientWidth
    )
    await userEvent.keyboard('{Enter}')
  },
}

export const LongLastChip: Story = {
  render: () => (
    <FilterHarness
      width={320}
      initialQuery={{
        clauses: [
          {
            kind: 'account',
            ids: [
              'A very long account name taking the entire available line width',
            ],
          },
        ],
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const chip = canvas.getByRole('combobox', { name: /^A very long account/ })
    const add = canvas.getByRole('button', { name: 'Add filter' })
    await waitFor(() =>
      expect(chip.querySelector('[data-overflow]')).not.toBeNull()
    )
    const bounds = canvas.getByLabelText('Filter').getBoundingClientRect()
    await expect(add.getBoundingClientRect().right).toBeLessThanOrEqual(
      bounds.right + 1
    )
    await expect(
      Math.abs(
        chip.getBoundingClientRect().top - add.getBoundingClientRect().top
      )
    ).toBeLessThan(2)
  },
}

export const SearchToFilter: Story = {
  render: () => <FilterHarness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      canvas.getByRole('button', { name: 'Search transactions' })
    )
    await userEvent.type(
      canvas.getByRole('textbox', { name: 'Search transactions' }),
      'coffee'
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Add filter' }))
    await waitFor(() =>
      expect(body.getByRole('menuitem', { name: 'Account' })).toBeVisible()
    )
    await userEvent.keyboard('{Escape}')
    await expect(
      canvas.getByRole('button', { name: 'coffee' })
    ).toBeInTheDocument()
  },
}

export const SearchClearAndBlur: Story = {
  render: () => <FilterHarness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      canvas.getByRole('button', { name: 'Search transactions' })
    )
    await userEvent.type(
      canvas.getByRole('textbox', { name: 'Search transactions' }),
      'coffee'
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Clear Field' }))
    await waitFor(() =>
      expect(canvas.getByLabelText('Search query')).toHaveTextContent(/^$/)
    )
    await waitFor(() => expect(canvas.queryByRole('textbox')).toBeNull())
    await userEvent.click(
      canvas.getByRole('button', { name: 'Search transactions' })
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Add filter' }))
    await userEvent.click(
      await body.findByRole('menuitem', { name: 'Only New' })
    )
    await waitFor(() =>
      expect(
        canvas.getByRole('button', { name: 'Only New' })
      ).toBeInTheDocument()
    )
    await expect(
      canvas.getByRole('button', { name: 'Search transactions' })
    ).toBeInTheDocument()
    await expect(canvas.getByLabelText('Search query')).toHaveTextContent(/^$/)
  },
}

const changedQuery = fn()

export const LastModified: Story = {
  render: () => (
    <FilterHarness initialSearch="Lunch" onQueryChange={changedQuery} />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Add filter' }))
    await userEvent.click(
      await body.findByText('Last modified', { exact: true })
    )
    const choice = await body.findByText('Last 7 days', { exact: true })
    changedQuery.mockClear()
    choice.closest<HTMLElement>('[role="menuitem"], button')!.focus()
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(choice).not.toBeInTheDocument())
    await expect(changedQuery).toHaveBeenCalledTimes(1)
    await expect(changedQuery).toHaveBeenCalledWith({
      clauses: [{ kind: 'changed', period: '7d' }],
    })
    await expect(
      canvas.getByRole('button', { name: 'Modified in the last 7 days' })
    ).toHaveFocus()
    await expect(readQuery(canvasElement).clauses).toEqual([
      { kind: 'changed', period: '7d' },
    ])
    await expect(canvas.getByLabelText('Search query')).toHaveTextContent(
      'Lunch'
    )
    await userEvent.click(
      canvas.getByRole('button', { name: 'Modified in the last 7 days' })
    )
    const yesterday = await body.findByText('Yesterday', { exact: true })
    await userEvent.click(yesterday)
    await waitFor(() => expect(yesterday).not.toBeInTheDocument())
    await expect(readQuery(canvasElement).clauses).toEqual([
      { kind: 'changed', period: 'yesterday' },
    ])
  },
}

export const MobileLastModified: Story = {
  ...LastModified,
  globals: { viewport: { value: 'zerro499' } },
}
