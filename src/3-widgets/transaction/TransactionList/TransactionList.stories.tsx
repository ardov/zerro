import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test'
import type { core } from '@/zerro-core/redux'
import { TransactionList } from './index'
import { useListTransactions } from './useListTransactions'
import {
  TransactionListDrawer,
  useTransactionDrawer,
} from '@/3-widgets/global/TransactionListDrawer'

function Example({ transactionIds }: { transactionIds?: string[] }) {
  const [query, setQuery] = useState<core.transactions.TTransactionQuery>({
    clauses: [],
  })
  const [search, setSearch] = useState('')
  const list = useListTransactions(transactionIds, { query, search })
  const [opened, setOpened] = useState('')
  const [checked, setChecked] = useState<string[]>([])
  return (
    <div className="h-[600px] w-[560px] max-w-[95vw]">
      <TransactionList
        list={list}
        className="h-full"
        onTrOpen={setOpened}
        view={{
          query,
          search,
          onQueryChange: setQuery,
          onSearchChange: setSearch,
          restoredTopDate: null,
          restoredScrollOffset: null,
          checked,
          onCheckedChange: setChecked,
          onScrollChange: () => {},
        }}
      />
      <output aria-label="Opened operation" className="sr-only">
        {opened}
      </output>
      <output aria-label="Selected operations" className="sr-only">
        {JSON.stringify(checked)}
      </output>
    </div>
  )
}
const meta = {
  title: 'App/Transactions/Filter flow',
  component: Example,
  parameters: {
    layout: 'centered',
    app: { scenario: 'transaction-filters', route: '/transactions' },
  },
  render: () => <Example />,
} satisfies Meta<typeof Example>
export default meta
type Story = StoryObj<typeof meta>

export const NewQuickFilter: Story = {
  render: () => <Example transactionIds={['lunch', 'dinner']} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await expect(
      await canvas.findByRole('button', { name: 'New 2' })
    ).toBeVisible()
    expect(canvas.queryByRole('button', { name: /^No Category \d/ })).toBeNull()
    fireEvent.contextMenu(canvas.getByText('Dinner groceries'))
    await userEvent.click(
      await body.findByRole('menuitem', { name: 'Mark as viewed' })
    )
    await userEvent.click(await canvas.findByRole('button', { name: 'New 1' }))
    await waitFor(() =>
      expect(canvas.queryByText('Dinner groceries')).toBeNull()
    )
    await expect(canvas.getByText('Lunch groceries')).toBeVisible()
    fireEvent.contextMenu(canvas.getByText('Lunch groceries'))
    await userEvent.click(
      await body.findByRole('menuitem', { name: 'Mark as viewed' })
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Remove New' }))
    await expect(await canvas.findByText('Dinner groceries')).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: 'Search transactions' })
    ).toBeVisible()
    await expect(canvas.queryByRole('button', { name: /^New \d/ })).toBeNull()
  },
}

export const NoCategoryQuickFilter: Story = {
  parameters: {
    app: { scenario: 'uncategorized-transaction', route: '/transactions' },
  },
  render: () => <Example transactionIds={['dinner', 'legacy']} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const quickFilter = await canvas.findByRole('button', {
      name: 'No Category 1',
    })
    await userEvent.click(quickFilter)
    const list = within(canvas.getByRole('list', { name: 'Transactions' }))
    await waitFor(() => expect(list.queryByText('Dinner groceries')).toBeNull())
    expect(list.getByText('Coffee')).toBeVisible()
    await userEvent.click(
      canvas.getByRole('button', { name: 'Remove No Category' })
    )
    expect(await canvas.findByText('Dinner groceries')).toBeVisible()
    expect(canvas.getByRole('button', { name: 'No Category 1' })).toBeVisible()
  },
}

export const RangeSelection: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const user = userEvent.setup()
    const canvas = within(canvasElement)
    const list = await canvas.findByRole('list', { name: 'Transactions' })
    const checkboxes = within(list).getAllByRole('checkbox')
    const expectChecked = async (indexes: number[]) => {
      for (const [index, checkbox] of checkboxes.entries()) {
        if (indexes.includes(index)) await expect(checkbox).toBeChecked()
        else await expect(checkbox).not.toBeChecked()
      }
    }
    expect(checkboxes).toHaveLength(4)
    await user.click(checkboxes[0])
    await user.click(checkboxes[0])
    await expectChecked([])
    await user.keyboard('{Shift>}')
    await user.click(checkboxes[2])
    await user.keyboard('{/Shift}')
    await expectChecked([0, 1, 2])
    await user.click(
      canvas.getByRole('button', { name: 'Remove Selected 3 transactions' })
    )
    await expectChecked([])
    await user.click(checkboxes[0])
    await user.click(checkboxes[2])
    await user.keyboard('{Shift>}')
    await user.click(checkboxes[3])
    await user.keyboard('{/Shift}')
    await expectChecked([0, 2, 3])
    await expect(
      canvas.getByLabelText('Opened operation')
    ).toBeEmptyDOMElement()

    await user.keyboard('{Shift>}')
    await user.click(checkboxes[1])
    await user.keyboard('{/Shift}')
    await expectChecked([0, 1, 2, 3])

    await user.keyboard('{Shift>}')
    await user.click(checkboxes[3])
    await user.keyboard('{/Shift}')
    await expectChecked([0])
    await user.keyboard('{Shift>}')
    await user.click(checkboxes[1])
    await user.keyboard('{/Shift}')
    await expectChecked([0, 1, 2, 3])

    // A normal click toggles one row; Shift applies the endpoint's action
    // uniformly even when the range contains a mixture of states.
    await user.click(checkboxes[2])
    await expectChecked([0, 1, 3])
    await user.keyboard('{Shift>}')
    await user.click(
      checkboxes[0]
        .closest('[data-row-key]')!
        .querySelector<HTMLElement>('.transaction-line')!
    )
    await user.keyboard('{/Shift}')
    await expectChecked([3])
    await user.keyboard('{Shift>}')
    await user.click(checkboxes[2])
    await user.keyboard('{/Shift}')
    await expectChecked([0, 1, 2, 3])
    await expect(
      canvas.getByLabelText('Opened operation')
    ).toBeEmptyDOMElement()

    await user.click(
      canvas.getByRole('button', { name: 'Remove Selected 4 transactions' })
    )
    await expectChecked([])
    await user.keyboard('{Shift>}')
    await user.click(checkboxes[0])
    await user.keyboard('{/Shift}')
    await expectChecked([0])
    checkboxes[2].focus()
    await user.keyboard('{Shift>} {/Shift}')
    await expectChecked([0, 1, 2])
    checkboxes[0].focus()
    await user.keyboard('{Shift>} {/Shift}')
    await expectChecked([])
    checkboxes[2].focus()
    await user.keyboard('{Shift>} {/Shift}')
    await expectChecked([0, 1, 2])
  },
}

export const FilteredRangeSelection: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const user = userEvent.setup()
    const canvas = within(canvasElement)
    const list = await canvas.findByRole('list', { name: 'Transactions' })
    const coffeeCheckbox = within(
      within(list).getByText('Coffee').closest<HTMLElement>('[data-row-key]')!
    ).getByRole('checkbox')
    await user.click(coffeeCheckbox)
    await user.click(
      canvas.getByRole('button', { name: 'Search transactions' })
    )
    await user.type(
      canvas.getByRole('combobox', { name: 'Search transactions' }),
      'lunch'
    )
    await user.keyboard('{Enter}')
    await waitFor(() => expect(within(list).queryByText('Coffee')).toBeNull())
    const checkboxes = within(list).getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(2)
    await user.keyboard('{Shift>}')
    await user.click(checkboxes[0])
    await user.keyboard('{/Shift}')
    await expect(checkboxes[0]).toBeChecked()
    await expect(checkboxes[1]).not.toBeChecked()
    await user.keyboard('{Shift>}')
    await user.click(checkboxes[1])
    await user.keyboard('{/Shift}')
    await expect(checkboxes[0]).toBeChecked()
    await expect(checkboxes[1]).toBeChecked()
    const selected = JSON.parse(
      canvas.getByLabelText('Selected operations').textContent!
    )
    expect(selected.sort()).toEqual(['legacy', 'lunch', 'other'])
    await user.keyboard('{Shift>}')
    await user.click(checkboxes[0])
    await user.keyboard('{/Shift}')
    for (const checkbox of checkboxes) await expect(checkbox).not.toBeChecked()
    await expect(
      canvas.getByLabelText('Selected operations')
    ).toHaveTextContent('["legacy"]')
  },
}

export const VirtualizedRangeSelection: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: {
    app: { scenario: 'transaction-navigation', route: '/transactions' },
  },
  play: async ({ canvasElement }) => {
    const user = userEvent.setup()
    const canvas = within(canvasElement)
    const list = await canvas.findByRole('list', { name: 'Transactions' })
    const first = within(list).getAllByRole('checkbox')[0]
    const firstKey =
      first.closest<HTMLElement>('[data-row-key]')!.dataset.rowKey
    await user.click(first)
    const viewport = list.closest<HTMLElement>('.kit-scroll-viewport')!
    viewport.scrollTop = viewport.scrollHeight
    fireEvent.scroll(viewport)
    await waitFor(() =>
      expect(list.querySelector(`[data-row-key="${firstKey}"]`)).toBeNull()
    )
    const checkboxes = within(list).getAllByRole('checkbox')
    await user.keyboard('{Shift>}')
    await user.click(checkboxes.at(-1)!)
    await user.keyboard('{/Shift}')
    // The full range includes operations that were never mounted together.
    await expect(canvas.getByText('Selected 80 transactions')).toBeVisible()
    const selected = JSON.parse(
      canvas.getByLabelText('Selected operations').textContent!
    )
    expect(new Set(selected)).toEqual(
      new Set(Array.from({ length: 80 }, (_, index) => `purchase-${index}`))
    )
    viewport.scrollTop = 0
    fireEvent.scroll(viewport)
    await waitFor(() =>
      expect(list.querySelector(`[data-row-key="${firstKey}"]`)).not.toBeNull()
    )
    for (const checkbox of within(list).getAllByRole('checkbox'))
      await expect(checkbox).toBeChecked()
    await user.keyboard('{Shift>}')
    await user.click(within(list).getAllByRole('checkbox')[0])
    await user.keyboard('{/Shift}')
    await expect(
      canvas.getByLabelText('Selected operations')
    ).toHaveTextContent('[]')
  },
}

export const SearchAndMerchant: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      canvas.getByRole('button', { name: 'Search transactions' })
    )
    await userEvent.type(
      canvas.getByRole('combobox', { name: 'Search transactions' }),
      'lunch'
    )
    await userEvent.keyboard('{Enter}')
    await waitFor(() =>
      expect(canvas.queryByText('Dinner groceries')).toBeNull()
    )
    await expect(canvas.getByText('Lunch elsewhere')).toBeVisible()
    await expect(canvas.getByText('Lunch groceries')).toBeVisible()
    fireEvent.contextMenu(canvas.getByText('Lunch groceries'))
    await userEvent.click(
      await body.findByText('Filter by “Lidl”', { exact: true })
    )
    await waitFor(() =>
      expect(canvas.queryByText('Lunch elsewhere')).toBeNull()
    )
    await expect(canvas.getByText('Lunch groceries')).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: 'lunch' })
    ).toBeInTheDocument()
    await expect(
      canvas.getByRole('combobox', { name: 'Lidl' })
    ).toBeInTheDocument()
    await userEvent.click(
      canvas
        .getAllByText('Lidl')
        .find(element => !element.closest('[data-slot="chip"]'))!
    )
    await expect(canvas.getByLabelText('Opened operation')).toHaveTextContent(
      window.innerWidth < 900 ? 'lunch' : ''
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Remove lunch' }))
    await waitFor(() =>
      expect(canvas.getByText('Dinner groceries')).toBeVisible()
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Remove Lidl' }))
    await waitFor(() => expect(canvas.getByText('Legacy café')).toBeVisible())
    fireEvent.contextMenu(canvas.getByText('Legacy café'))
    await userEvent.click(
      await body.findByText('Search for “Legacy café”', { exact: true })
    )
    await waitFor(() =>
      expect(canvas.queryByText('Lunch groceries')).toBeNull()
    )
    await expect(
      canvas.getAllByRole('button', { name: 'Legacy café' })[0]
    ).toBeInTheDocument()
  },
}

export const MobileContext: Story = {
  ...SearchAndMerchant,
  globals: { viewport: { value: 'zerro499' } },
}

export const PreviewDate: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByRole('button', { name: 'Search transactions' })
    )
    await userEvent.type(
      canvas.getByRole('combobox', { name: 'Search transactions' }),
      'dat'
    )
    await waitFor(() =>
      expect(canvas.queryByText('Lunch elsewhere')).toBeNull()
    )
    const body = within(canvasElement.ownerDocument.body)
    const date = body.getByRole('option', { name: 'Date' })
    await userEvent.hover(date)
    await expect(date).toHaveAttribute('aria-selected', 'true')
    await expect(canvas.queryByText('Lunch elsewhere')).toBeNull()
    await expect(await canvas.findByText('Lunch elsewhere')).toBeVisible()
    await userEvent.keyboard('{ArrowUp}')
    await expect(date).toHaveAttribute('aria-selected', 'false')
    await expect(canvas.getByText('Lunch elsewhere')).toBeVisible()
    await waitFor(() =>
      expect(canvas.queryByText('Lunch elsewhere')).toBeNull()
    )
    await userEvent.keyboard('{ArrowDown}{Enter}')
    await expect(
      await within(canvasElement.ownerDocument.body).findByLabelText(
        'Date From'
      )
    ).toBeVisible()
    await userEvent.keyboard('{Escape}')
    await expect(
      await canvas.findByRole('button', { name: 'Search transactions' })
    ).toBeVisible()
    await expect(canvas.getByText('Lunch elsewhere')).toBeVisible()
  },
}

export const PreviewScrollPosition: Story = {
  parameters: {
    app: { scenario: 'transaction-navigation', route: '/transactions' },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const list = await canvas.findByRole('list', { name: 'Transactions' })
    const viewport = list.closest<HTMLElement>('.kit-scroll-viewport')!
    await waitFor(() => expect(viewport.scrollHeight).toBeGreaterThan(4000))
    const originalHeight = viewport.scrollHeight
    viewport.scrollTop = 1900
    fireEvent.scroll(viewport)
    const open = async () => {
      await userEvent.click(
        canvas.getByRole('button', { name: 'Search transactions' })
      )
      return canvas.getByRole('combobox', { name: 'Search transactions' })
    }

    const search = await open()
    await userEvent.type(search, 'date')
    await waitFor(() =>
      expect(within(list).queryAllByRole('listitem')).toHaveLength(0)
    )
    await userEvent.hover(
      within(canvasElement.ownerDocument.body).getByRole('option', {
        name: 'Date',
      })
    )
    await waitFor(() => expect(viewport.scrollTop).toBe(1900))
    viewport.scrollTop = 2100
    fireEvent.scroll(viewport)
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(viewport.scrollTop).toBe(2100))

    const narrowing = await open()
    await userEvent.type(narrowing, 'purchase 79')
    await waitFor(() =>
      expect(within(list).getAllByRole('checkbox')).toHaveLength(1)
    )
    expect(viewport.scrollTop).toBe(0)
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(viewport.scrollTop).toBe(2100))

    const next = await open()
    await userEvent.type(next, 'purchase 7')
    await waitFor(() => {
      expect(viewport.scrollHeight).toBeLessThan(originalHeight)
      expect(viewport.scrollHeight - viewport.clientHeight).toBeGreaterThan(200)
    })
    viewport.scrollTop = 200
    fireEvent.scroll(viewport)
    await userEvent.keyboard('{Enter}')
    await canvas.findByRole('button', { name: 'purchase 7' })
    expect(viewport.scrollTop).toBe(200)
  },
}

export const CrossFieldSearch: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByRole('button', { name: 'Search transactions' })
    )
    await userEvent.type(
      canvas.getByRole('combobox', { name: 'Search transactions' }),
      'дшвд food usd 12,00 lunch'
    )
    await waitFor(() =>
      expect(canvas.queryByText('Lunch elsewhere')).toBeNull()
    )
    await waitFor(() =>
      expect(canvas.queryByText('Dinner groceries')).toBeNull()
    )
    await expect(canvas.getByText('Lunch groceries')).toBeVisible()
    await userEvent.keyboard('{Enter}')
  },
}

export const HiddenActionsPassThrough: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText('Lunch groceries')
    const bar = canvasElement.querySelector<HTMLElement>('.actions-transition')!
    const wrapper = bar.parentElement!
    const rect = wrapper.getBoundingClientRect()
    const hit = canvasElement.ownerDocument.elementFromPoint(
      rect.x + rect.width / 2,
      rect.y + rect.height / 2
    )
    await expect(hit).not.toBe(wrapper)
    await expect(wrapper.contains(hit)).toBe(false)
  },
}

export const HiddenActionsPassThroughMobile: Story = {
  tags: ['!dev', '!autodocs'],
  ...HiddenActionsPassThrough,
  globals: { viewport: { value: 'zerro499' } },
}

function DrawerExample() {
  const open = useTransactionDrawer()
  return (
    <>
      <button onClick={() => open({ title: 'Transaction history' })}>
        Open history
      </button>
      <TransactionListDrawer />
    </>
  )
}

export const DrawerScroll: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { app: { scenario: 'demo', route: '/transactions' } },
  render: () => <DrawerExample />,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Open history' })
    )
    const dialog = await body.findByRole('dialog', {
      name: 'Transaction history',
    })
    const viewport = dialog.querySelector<HTMLElement>('.kit-scroll-viewport')!
    await waitFor(() => expect(viewport.clientHeight).toBeGreaterThan(100))
    await waitFor(() =>
      expect(dialog.querySelectorAll('[data-row-key]').length).toBeGreaterThan(
        0
      )
    )
    await expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight)
    viewport.scrollTop = 300
    await waitFor(() =>
      expect(dialog.querySelector('.transaction-date-chip')).toHaveAttribute(
        'data-pinned'
      )
    )
    await expect(dialog.querySelectorAll('.kit-scroll-viewport').length).toBe(1)
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(dialog).not.toBeVisible())
  },
}

export const MobileDrawerScroll: Story = {
  tags: ['!dev', '!autodocs'],
  ...DrawerScroll,
  globals: { viewport: { value: 'zerro499' } },
}

export const DesktopMerchantClick: Story = {
  globals: { viewport: { value: 'zerro900' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const comment = canvas.getByText('Lunch groceries')
    const merchant = canvas.getAllByRole('button', { name: 'Lidl' })[0]
    expect(
      comment.getBoundingClientRect().left -
        merchant.getBoundingClientRect().right
    ).toBeCloseTo(8)
    await userEvent.click(merchant)
    await waitFor(() =>
      expect(canvas.getByRole('combobox', { name: 'Lidl' })).toBeVisible()
    )
    expect(canvas.getByLabelText('Opened operation')).toBeEmptyDOMElement()
    expect(canvas.queryByText('Lunch elsewhere')).toBeNull()
  },
}

export const MobileMerchantText: Story = {
  globals: { viewport: { value: 'zerro899' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.queryByRole('button', { name: 'Lidl' })).toBeNull()
    await userEvent.click(canvas.getAllByText('Lidl')[0])
    expect(canvas.getByLabelText('Opened operation')).not.toBeEmptyDOMElement()
    expect(
      canvas.getByRole('button', { name: 'Search transactions' })
    ).toBeVisible()
  },
}
