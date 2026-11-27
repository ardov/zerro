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
import { i18n } from '@/6-shared/localization'
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

export const MobileQuickFilters: Story = {
  parameters: { layout: 'fullscreen' },
  globals: { locale: 'ru', viewport: { value: 'iphone12' } },
  render: () => (
    <div className="px-2 pt-2">
      <Filter
        query={{ clauses: [] }}
        search=""
        quickFilters={[
          { clause: { kind: 'viewed', value: false }, count: 12 },
          { clause: { kind: 'tag', ids: ['null'] }, count: 48 },
        ]}
        summary={{ shown: false, onToggle: fn() }}
        onQueryChange={fn()}
        onSearchChange={fn()}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    if (!('__vitest_browser_runner__' in window)) return
    const { page } = await import('vitest/browser')
    const canvas = within(canvasElement)
    const newFilter = await canvas.findByRole('button', { name: 'Новые 12' })
    const noCategory = canvas.getByRole('button', { name: 'Без категории 48' })
    const search = canvas.getByRole('button', { name: 'Поиск операций' })
    const original = { width: window.innerWidth, height: window.innerHeight }
    try {
      for (const width of [360, 375, 388, 435, 436]) {
        await page.viewport(width, 844)
        await waitFor(() => {
          for (const chip of [newFilter, noCategory]) {
            expect(getComputedStyle(chip).paddingInlineStart).toBe('16px')
            expect(getComputedStyle(chip).paddingInlineEnd).toBe('16px')
            const onFirstLine =
              chip.getBoundingClientRect().top ===
              search.getBoundingClientRect().top
            expect(onFirstLine).toBe(chip === newFilter || width >= 388)
            const number = within(chip).getByText(/^(12|48)$/)
            expect(number.getBoundingClientRect().width > 1).toBe(width >= 436)
          }
        })
      }
    } finally {
      await page.viewport(original.width, original.height)
    }
  },
}

export const SearchAndFilters: Story = {
  render: () => (
    <FilterHarness
      initialQuery={{
        clauses: [
          {
            kind: 'account',
            ids: ['HSBC USD', 'N26 EUR', 'HSBC EUR'],
          },
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
    for (const name of ['New', 'Including deleted']) {
      const chip = canvas.getByRole('button', { name })
      await userEvent.click(chip)
      await expect(chip).toBeInTheDocument()
      await userEvent.keyboard('{Enter}{Space}')
      expect(readQuery(canvasElement).clauses).toHaveLength(2)
    }
    await userEvent.click(canvas.getByRole('button', { name: 'Remove New' }))
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
          { kind: 'account', ids: ['HSBC USD'] },
          { kind: 'tag', ids: ['Food'] },
        ],
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const first = canvas.getByRole('combobox', { name: 'HSBC USD' })
    const second = canvas.getByRole('combobox', { name: 'Food' })
    first.focus()
    await userEvent.keyboard('{Delete}')
    await waitFor(() => expect(first).not.toBeInTheDocument())
    await expect(second).toHaveFocus()
    await userEvent.click(canvas.getByRole('button', { name: 'Remove Food' }))
    await waitFor(() => expect(second).not.toBeInTheDocument())
    await expect(
      within(canvasElement).getByRole('button', { name: 'Search transactions' })
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
      await userEvent.click(
        canvas.getByRole('button', { name: 'Search transactions' })
      )
      await userEvent.click(
        await body.findByRole('option', { name: 'Category' })
      )
      await expect(
        await body.findByRole('combobox', { name: 'Select category' })
      ).toHaveFocus()
      await expect(body.getAllByRole('listbox')).toHaveLength(1)
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

export const LocalizedUncategorizedFilter: Story = {
  render: () => <FilterHarness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const originalLanguage = i18n.language
    try {
      await userEvent.click(
        canvas.getByRole('button', { name: 'Search transactions' })
      )
      await i18n.changeLanguage('ru')
      const field = await canvas.findByRole('combobox', {
        name: 'Поиск операций',
      })
      await userEvent.type(field, 'Без категории')
      await userEvent.click(
        await body.findByRole('option', { name: 'Без категории Категория' })
      )
      const chip = await canvas.findByRole('combobox', {
        name: 'Без категории',
      })
      await userEvent.click(chip)
      await expect(
        await body.findByRole('option', { name: 'Без категории' })
      ).toHaveAttribute('aria-selected', 'true')
      await i18n.changeLanguage('en')
      await expect(
        await body.findByRole('option', { name: 'No Category' })
      ).toHaveAttribute('aria-selected', 'true')
      await userEvent.keyboard('{Escape}')
      await expect(
        await canvas.findByRole('combobox', { name: 'No Category' })
      ).toBeVisible()
    } finally {
      await i18n.changeLanguage(originalLanguage)
    }
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

export const EmptyAccountCleanup: Story = {
  render: () => (
    <FilterHarness
      initialQuery={{ clauses: [{ kind: 'account', ids: ['HSBC USD'] }] }}
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('combobox', { name: 'HSBC USD' }))
    await body.findByRole('option', { name: /^HSBC USD/ })
    expect(
      body.queryByRole('option', { name: /^Debts/ })
    ).not.toBeInTheDocument()
    await step('Clear the account selection', async () => {
      await userEvent.click(
        await body.findByRole('option', { name: /^HSBC USD/ })
      )
      await expect(body.getByRole('listbox')).toBeVisible()
      expect(readQuery(canvasElement).clauses).toEqual([])
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
          canvas.getByRole('button', { name: 'Search transactions' })
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
    await userEvent.click(
      canvas.getByRole('button', { name: 'Search transactions' })
    )
    await userEvent.click(await body.findByRole('option', { name: 'Type' }))
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
    await userEvent.click(
      canvas.getByRole('button', { name: 'Search transactions' })
    )
    await userEvent.click(await body.findByRole('option', { name: 'Amount' }))
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
    const chip = canvas.getByRole('button', { name: '100–500' })
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
      canvas.getByRole('button', { name: 'Search transactions' })
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
    await userEvent.click(
      canvas.getByRole('button', { name: 'Search transactions' })
    )
    const input = canvas.getByRole('combobox', { name: 'Search transactions' })
    await userEvent.type(input, 'Lidl groceries 12,00')
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true })
    await expect(input).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    const chip = await canvas.findByRole('button', {
      name: 'Lidl groceries 12,00',
    })
    chip.focus()
    await userEvent.keyboard('{Backspace}')
    await expect(
      canvas.getByRole('button', { name: 'Search transactions' })
    ).toBeVisible()
  },
}

export const DateRange: Story = {
  render: () => <FilterHarness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      canvas.getByRole('button', { name: 'Search transactions' })
    )
    await userEvent.click(await body.findByRole('option', { name: 'Date' }))
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
      canvas.getByRole('button', { name: 'Search transactions' })
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
      initialQuery={{ clauses: [{ kind: 'account', ids: ['HSBC USD'] }] }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Add filter' }))
    await userEvent.click(await body.findByRole('option', { name: 'Merchant' }))
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
    await expect(
      await body.findByRole('option', { name: 'Merchant' })
    ).toBeVisible()
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
          {
            kind: 'account',
            ids: ['HSBC USD', 'N26 EUR', 'HSBC EUR'],
          },
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
    const last = canvas.getByRole('button', { name: 'From 12' })
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
    const input = canvas.getByRole('combobox', { name: 'Search transactions' })
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
  render: () => <FilterHarness initialSearch="coffee" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Add filter' }))
    await userEvent.type(
      canvas.getByRole('combobox', { name: 'Search transactions' }),
      '123'
    )
    await userEvent.keyboard('{ArrowDown}{Enter}')
    await waitFor(() =>
      expect(readQuery(canvasElement).clauses).toEqual([
        { kind: 'amount', gte: 123, lte: 123 },
      ])
    )
    await expect(canvas.getByLabelText('Search query')).toHaveTextContent(
      /^coffee$/
    )
  },
}

export const HistoryBack: Story = {
  parameters: { historyShortcuts: true },
  render: () => <FilterHarness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByRole('button', { name: 'Search transactions' })
    )
    await userEvent.type(
      canvas.getByRole('combobox', { name: 'Search transactions' }),
      '123'
    )
    await userEvent.keyboard('{Alt>}{ArrowLeft}{/Alt}')
    await waitFor(() =>
      expect(
        canvas.getByRole('button', { name: 'Search transactions' })
      ).toHaveFocus()
    )
    await expect(canvas.getByLabelText('Search query')).toHaveTextContent(/^$/)
  },
}

export const EditSearch: Story = {
  render: () => <FilterHarness initialSearch="coffee" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'coffee' }))
    await userEvent.keyboard('{End}house{Tab}{Escape}')
    await expect(canvas.getByLabelText('Search query')).toHaveTextContent(
      /^coffee$/
    )
    await userEvent.click(canvas.getByRole('button', { name: 'coffee' }))
    await userEvent.clear(
      canvas.getByRole('combobox', { name: 'Search transactions' })
    )
    await userEvent.keyboard('{Enter}')
    await waitFor(() =>
      expect(canvas.getByLabelText('Search query')).toHaveTextContent(/^$/)
    )
    await expect(
      canvas.getByRole('button', { name: 'Search transactions' })
    ).toBeVisible()
  },
}

export const SearchBlur: Story = {
  render: () => <FilterHarness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByRole('button', { name: 'Search transactions' })
    )
    await userEvent.type(
      canvas.getByRole('combobox', { name: 'Search transactions' }),
      '123'
    )
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.click(canvasElement)
    await waitFor(() =>
      expect(canvas.getByLabelText('Search query')).toHaveTextContent(/^123$/)
    )
    expect(readQuery(canvasElement).clauses).toEqual([])
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
      await body.findByRole('option', { name: 'Last modified' })
    )
    const choice = await body.findByRole('option', { name: 'Last 7 days' })
    changedQuery.mockClear()
    await userEvent.click(choice)
    await waitFor(() =>
      expect(body.queryByRole('listbox')).not.toBeInTheDocument()
    )
    await expect(changedQuery).toHaveBeenCalledTimes(1)
    await expect(
      canvas.getByRole('combobox', { name: 'Modified in 7d' })
    ).toHaveFocus()
    await expect(readQuery(canvasElement).clauses).toEqual([
      { kind: 'changed', period: '7d' },
    ])
    await expect(canvas.getByLabelText('Search query')).toHaveTextContent(
      'Lunch'
    )
    await userEvent.click(
      canvas.getByRole('combobox', { name: 'Modified in 7d' })
    )
    const yesterday = await body.findByRole('option', { name: 'Yesterday' })
    await userEvent.click(yesterday)
    await waitFor(() =>
      expect(body.queryByRole('listbox')).not.toBeInTheDocument()
    )
    await expect(readQuery(canvasElement).clauses).toEqual([
      { kind: 'changed', period: 'yesterday' },
    ])
  },
}

export const MobileLastModified: Story = {
  ...LastModified,
  globals: { viewport: { value: 'zerro499' } },
}

export const AmountCurrency: Story = {
  render: () => <FilterHarness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      canvas.getByRole('button', { name: 'Search transactions' })
    )
    await userEvent.click(await body.findByRole('option', { name: 'Amount' }))
    const from = await body.findByRole('spinbutton', { name: 'Amount from' })
    await expect(from).toHaveAccessibleDescription('From')
    await expect(
      body.getByRole('spinbutton', { name: 'Amount up to' })
    ).toHaveAccessibleDescription('Up to')
    await userEvent.click(body.getByRole('combobox', { name: 'Currency' }))
    await body.findByRole('option', { name: /^USD(?: |$)/ })
    expect(
      body.getAllByRole('option').map(option => option.textContent?.slice(0, 3))
    ).toEqual(['EUR', 'USD'])
    await userEvent.click(body.getByRole('option', { name: /^USD(?: |$)/ }))
    await waitFor(() =>
      expect(body.queryByRole('listbox')).not.toBeInTheDocument()
    )
    await expect(from).toBeVisible()
    await userEvent.keyboard('{Escape}')
    await waitFor(() =>
      expect(body.queryByRole('dialog')).not.toBeInTheDocument()
    )
    expect(readQuery(canvasElement).clauses).toEqual([
      { kind: 'amount', currencies: ['USD'] },
    ])
    await userEvent.click(canvas.getByRole('button', { name: /^USD(?: |$)/ }))
    await userEvent.type(
      await body.findByRole('spinbutton', { name: 'Amount from' }),
      '0'
    )
    await userEvent.type(
      body.getByRole('spinbutton', { name: 'Amount up to' }),
      '10.5'
    )
    await userEvent.click(body.getByRole('button', { name: 'Remove Currency' }))
    await userEvent.keyboard('{Escape}')
    await waitFor(() =>
      expect(body.queryByRole('dialog')).not.toBeInTheDocument()
    )
    expect(readQuery(canvasElement).clauses).toEqual([
      { kind: 'amount', gte: 0, lte: 10.5 },
    ])
    await expect(canvas.getByRole('button', { name: '0–10.5' })).toBeVisible()
  },
}

export const MobileAmountCurrency: Story = {
  ...AmountCurrency,
  globals: { viewport: { value: 'zerro499' } },
}

export const Debtor: Story = {
  parameters: {
    app: { scenario: 'debtor-navigation', route: '/transactions' },
  },
  render: () => <FilterHarness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      canvas.getByRole('button', { name: 'Search transactions' })
    )
    await userEvent.click(await body.findByRole('option', { name: 'Debtor' }))
    const input = await body.findByRole('combobox', { name: 'Find debtor' })
    await userEvent.type(input, 'Alex')
    await userEvent.click(await body.findByRole('option', { name: 'Alex' }))
    expect(readQuery(canvasElement).clauses).toEqual([
      { kind: 'debtor', ids: ['alex'] },
    ])
    await userEvent.keyboard('{Escape}')
    await waitFor(() =>
      expect(body.queryByRole('listbox')).not.toBeInTheDocument()
    )
    await expect(canvas.getByRole('combobox', { name: 'Alex' })).toHaveFocus()
    await userEvent.click(canvas.getByRole('button', { name: 'Add filter' }))
    await userEvent.type(
      canvas.getByRole('combobox', { name: 'Search transactions' }),
      'Bob'
    )
    await userEvent.click(
      await body.findByRole('option', { name: 'Bob Debtor' })
    )
    expect(readQuery(canvasElement).clauses).toEqual([
      { kind: 'debtor', ids: ['alex', 'bob'] },
    ])
  },
}

export const LongMerchantList: Story = {
  render: () => <FilterHarness />,
  parameters: { app: { scenario: 'many-merchants', route: '/transactions' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      canvas.getByRole('button', { name: 'Search transactions' })
    )
    const field = canvas.getByRole('combobox', { name: 'Search transactions' })
    await userEvent.type(field, 'store')
    const list = body.getByRole('listbox')
    const options = within(list)
    await expect(
      await options.findByRole('option', { name: 'Store 000 Merchant' })
    ).toBeVisible()
    expect(options.getAllByRole('option').length).toBeLessThan(50)
    list.scrollTo({ top: list.scrollHeight })
    const last = await options.findByRole('option', {
      name: 'Store 999 Merchant',
    })
    expect(
      canvasElement.ownerDocument.getElementById(
        field.getAttribute('aria-activedescendant')!
      )
    ).toHaveAttribute('aria-selected', 'true')
    fireEvent.pointerMove(last, { pointerType: 'mouse' })
    await waitFor(() => expect(last).toHaveAttribute('aria-selected', 'true'))
    fireEvent.pointerLeave(last, { pointerType: 'mouse' })
    await userEvent.keyboard('{ArrowUp}{Enter}')
    expect(readQuery(canvasElement).clauses).toEqual([
      { kind: 'merchant', ids: ['998'] },
    ])
  },
}
