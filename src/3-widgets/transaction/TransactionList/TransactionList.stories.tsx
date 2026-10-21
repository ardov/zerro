import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test'
import type { core } from '@/zerro-core/redux'
import { TransactionList } from './index'
import {
  TransactionListDrawer,
  useTransactionDrawer,
} from '@/3-widgets/global/TransactionListDrawer'

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
    // Narrow screens keep the payee as ordinary row content.
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
    expect(comment.previousElementSibling?.tagName).toBe('BUTTON')
    expect(getComputedStyle(comment).marginLeft).toBe('8px')
    await userEvent.click(canvas.getAllByRole('button', { name: 'Lidl' })[0])
    await waitFor(() =>
      expect(canvas.getByLabelText('Applied query')).toHaveTextContent(
        'merchant'
      )
    )
    expect(canvas.getByRole('combobox', { name: 'Lidl' })).toBeInTheDocument()
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
    expect(canvas.getByLabelText('Applied query')).not.toHaveTextContent(
      'merchant'
    )
  },
}
