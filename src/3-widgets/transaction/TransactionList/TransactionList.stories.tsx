import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test'
import type { core } from '@/zerro-core/redux'
import { TransactionList } from './index'

function Example() {
  const [query, setQuery] = useState<core.transactions.TTransactionQuery>({
    clauses: [],
  })
  const [search, setSearch] = useState('')
  const [opened, setOpened] = useState('')
  return (
    <div className="h-[600px] w-[560px] max-w-[95vw]">
      <TransactionList
        className="h-full"
        onTrOpen={setOpened}
        view={{
          query,
          search,
          onQueryChange: setQuery,
          onSearchChange: setSearch,
          restoredTopDate: null,
          onTopDateChange: () => {},
        }}
      />
      <output aria-label="Opened operation" className="sr-only">
        {opened}
      </output>
      <output aria-label="Applied query" className="sr-only">
        {JSON.stringify({ query, search })}
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

export const SearchAndMerchant: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      canvas.getByRole('button', { name: 'Search transactions' })
    )
    await userEvent.type(
      canvas.getByRole('textbox', { name: 'Search transactions' }),
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
    await expect(canvas.queryByRole('textbox')).toBeNull()
    // Counterparty text is ordinary row content now: its tap opens the operation.
    await userEvent.click(
      canvas
        .getAllByText('Lidl')
        .find(element => !element.closest('[data-slot="chip"]'))!
    )
    await expect(canvas.getByLabelText('Opened operation')).toHaveTextContent(
      'lunch'
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
      canvas.getByRole('button', { name: 'Legacy café' })
    ).toBeInTheDocument()
    await expect(canvas.queryByRole('textbox')).toBeNull()
  },
}

export const MobileContext: Story = {
  ...SearchAndMerchant,
  globals: { viewport: { value: 'zerro499' } },
}

export const CrossFieldSearch: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByRole('button', { name: 'Search transactions' })
    )
    await userEvent.type(
      canvas.getByRole('textbox', { name: 'Search transactions' }),
      'lidl food usd 12,00 lunch'
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
