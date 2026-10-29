import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test'
import { useNavigate } from 'react-router-dom'
import {
  transactionScreen,
  useTransactionPreview,
} from './TransactionPreviewDrawer'
import TransactionsView from '@/2-pages/Transactions'
import { Layout } from '@/1-app/Layout'
import { pageColumns } from '@/1-app/pageColumns'
import { Button } from '@/6-shared/ui/kit/Button'
import { useTransactionDrawer } from './TransactionListDrawer'
import { useEnvTransactionsDrawer } from './EnvTransactionsDrawer'
import { useAppDispatch } from '@/store'
import { core } from '@/zerro-core/redux'

const meta = {
  title: 'App/Transactions/Modal layers',
  parameters: {
    layout: 'fullscreen',
    app: {
      scenario: 'transaction-filters',
      globalWidgets: true,
      route: '/transactions',
    },
    viewport: {
      options: {
        wide: {
          name: 'Wide desktop',
          styles: { width: '1440px', height: '900px' },
          type: 'desktop',
        },
      },
    },
  },
  globals: { viewport: { value: 'wide' } },
} satisfies Meta
export default meta
type Story = StoryObj

function Harness() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const openPagePreview = useTransactionPreview()
  const pageTransaction = transactionScreen.useValue()
  const openList = useTransactionDrawer()
  const openEnvelope = useEnvTransactionsDrawer()
  return (
    <>
      <button data-testid="back" onClick={() => navigate(-1)}>
        Back
      </button>
      <button data-testid="forward" onClick={() => navigate(1)}>
        Forward
      </button>
      <button
        data-testid="purge-dinner"
        onClick={() =>
          dispatch(core.transactions.removePermanently(['dinner']))
        }
      >
        Apply remote removal
      </button>
      <output aria-label="Page transaction">{pageTransaction ?? 'none'}</output>
      <Button onClick={() => openPagePreview('other')}>
        Open page preview
      </Button>
      <Button onClick={() => openList({ title: 'All transactions' })}>
        Open all transactions
      </Button>
      <Button
        onClick={() =>
          openList({
            title: 'Explicit transactions',
            ids: ['lunch', 'dinner', 'unavailable'],
          })
        }
      >
        Open explicit list
      </Button>
      <Button
        onClick={() =>
          openList({
            title: 'Filtered transactions',
            initialQuery: { clauses: [{ kind: 'merchant', ids: ['lidl'] }] },
          })
        }
      >
        Open filtered list
      </Button>
      <Button
        onClick={() =>
          openEnvelope({
            title: 'Envelope transactions',
            envelopeConditions: { id: 'tag#Food', month: '2026-10' },
          })
        }
      >
        Open envelope list
      </Button>
      <Layout navigation columns={pageColumns.transactions}>
        <TransactionsView />
      </Layout>
    </>
  )
}

const checkLayer =
  (envelope: boolean, existing = false): Story['play'] =>
  async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    if (existing) {
      await userEvent.click(
        canvas.getByRole('button', { name: 'Open page preview' })
      )
      expect(canvas.getByLabelText('Page transaction')).toHaveTextContent(
        'other'
      )
      expect(body.queryByRole('dialog', { name: 'Transaction' })).toBeNull()
    }
    await userEvent.click(
      canvas.getByRole('button', {
        name: envelope ? 'Open envelope list' : 'Open filtered list',
      })
    )
    const list = await body.findByRole('dialog', {
      name: envelope ? 'Envelope transactions' : 'Filtered transactions',
    })
    const row = await within(list).findByText('Lunch groceries')
    await userEvent.click(row)
    const detailsRole = window.innerWidth >= 776 ? 'region' : 'dialog'
    const detailsScope = detailsRole === 'region' ? within(list) : body
    const preview = await detailsScope.findByRole(detailsRole, {
      name: 'Transaction',
    })
    await waitFor(() => expect(preview).toBeVisible())
    expect(list).toBeInTheDocument()
    expect(canvas.getByLabelText('Page transaction')).toHaveTextContent(
      existing ? 'other' : 'none'
    )
    // Simulate browser history through the story's MemoryRouter, even while
    // modal focus correctly makes the page controls inaccessible to a user.
    fireEvent.click(canvas.getByTestId('back'))
    await waitFor(() => expect(preview).not.toBeVisible())
    expect(list).toBeVisible()
    fireEvent.click(canvas.getByTestId('forward'))
    const restored = await detailsScope.findByRole(detailsRole, {
      name: 'Transaction',
    })
    await waitFor(() => expect(restored).toBeVisible())
    await waitFor(() =>
      expect(
        (detailsRole === 'region' ? list : restored).contains(
          document.activeElement
        )
      ).toBe(true)
    )
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(restored).not.toBeVisible())
    expect(list).toBeVisible()
    await userEvent.click(within(list).getByText('Dinner groceries'))
    const another = await detailsScope.findByRole(detailsRole, {
      name: 'Transaction',
    })
    await waitFor(() => expect(another).toBeVisible())
    await waitFor(() =>
      expect(
        (detailsRole === 'region' ? list : another).contains(
          document.activeElement
        )
      ).toBe(true)
    )
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(another).not.toBeVisible())
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(list).not.toBeInTheDocument())
    expect(canvas.getByLabelText('Page transaction')).toHaveTextContent(
      existing ? 'other' : 'none'
    )
  }

export const FilteredList: Story = {
  render: () => <Harness />,
  play: checkLayer(false),
}
export const EnvelopeList: Story = {
  render: () => <Harness />,
  play: checkLayer(true),
}
export const Mobile: Story = {
  ...FilteredList,
  globals: { viewport: { value: 'iphone13' } },
}

export const KeepsPageSelection: Story = {
  render: () => <Harness />,
  play: checkLayer(false, true),
}

export const RecursivePairs: Story = {
  tags: ['check'],
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByText('Lunch groceries'))
    const pageEditor = await canvas.findByRole('region', {
      name: 'Transaction',
    })
    const openCounterparty = async (editor: HTMLElement) => {
      await userEvent.click(
        within(editor).getByRole('button', { name: 'More' })
      )
      await userEvent.click(
        await body.findByRole('menuitem', { name: 'Merchant transactions' })
      )
    }
    await openCounterparty(pageEditor)
    const firstList = await body.findByRole('dialog', { name: 'Lidl' })
    await userEvent.click(
      await within(firstList).findByText('Dinner groceries')
    )
    const firstDetails = await within(firstList).findByRole('region', {
      name: 'Transaction',
    })
    const comment = within(firstDetails).getByRole('textbox', {
      name: 'Comment',
    })
    await userEvent.clear(comment)
    await userEvent.type(comment, 'Dinner saved in first pair')
    await openCounterparty(firstDetails)
    const secondList = await body.findByRole('dialog', { name: 'Lidl' })
    expect(secondList).not.toBe(firstList)
    await userEvent.click(
      await within(secondList).findByText('Lunch groceries')
    )
    const secondDetails = await within(secondList).findByRole('region', {
      name: 'Transaction',
    })
    expect(
      within(secondDetails).getByRole('textbox', { name: 'Comment' })
    ).toHaveValue('Lunch groceries')
    expect(canvas.getByLabelText('Page transaction')).toHaveTextContent('lunch')
    fireEvent.click(canvas.getByTestId('back'))
    await waitFor(() => expect(secondDetails).not.toBeVisible())
    expect(secondList).toBeVisible()
    fireEvent.click(canvas.getByTestId('back'))
    await waitFor(() => expect(secondList).not.toBeInTheDocument())
    expect(firstDetails).toBeVisible()
    expect(comment).toHaveValue('Dinner saved in first pair')
    await userEvent.click(within(firstList).getByText('Lunch groceries'))
    await waitFor(() =>
      expect(
        within(firstDetails).getByRole('textbox', { name: 'Comment' })
      ).toHaveValue('Lunch groceries')
    )
    fireEvent.click(canvas.getByTestId('back'))
    await waitFor(() => expect(firstDetails).not.toBeVisible())
    expect(firstList).toBeVisible()
    fireEvent.click(canvas.getByTestId('back'))
    await waitFor(() => expect(firstList).not.toBeInTheDocument())
    expect(canvas.getByLabelText('Page transaction')).toHaveTextContent('lunch')
    expect(pageEditor).toBeVisible()
  },
}

export const RecreationBeforeChild: Story = {
  tags: ['check'],
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      canvas.getByRole('button', { name: 'Open filtered list' })
    )
    const firstList = await body.findByRole('dialog', {
      name: 'Filtered transactions',
    })
    await userEvent.click(await within(firstList).findByText('Lunch groceries'))
    const details = await within(firstList).findByRole('region', {
      name: 'Transaction',
    })
    const time = within(details).getByLabelText('Time')
    await userEvent.click(time)
    fireEvent.change(time, { target: { value: '13:37' } })
    await userEvent.click(within(details).getByRole('button', { name: 'More' }))
    await userEvent.click(
      await body.findByRole('menuitem', { name: 'Merchant transactions' })
    )
    const childList = await body.findByRole('dialog', { name: 'Lidl' })
    await within(childList).findByText('Lunch groceries')
    fireEvent.click(canvas.getByTestId('back'))
    await waitFor(() => expect(childList).not.toBeInTheDocument())
    expect(within(details).getByLabelText('Time')).toHaveValue('13:37')
    expect(
      within(details).getByRole('textbox', { name: 'Comment' })
    ).toHaveValue('Lunch groceries')
    fireEvent.click(canvas.getByTestId('back'))
    await waitFor(() =>
      expect(
        within(firstList).queryByRole('region', { name: 'Transaction' })
      ).toBeNull()
    )
    expect(firstList).toBeVisible()
  },
}

export const IdenticalRowsDiscardPreviousDraft: Story = {
  tags: ['check'],
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      canvas.getByRole('button', { name: 'Open filtered list' })
    )
    const list = await body.findByRole('dialog', {
      name: 'Filtered transactions',
    })
    const otherRow = await within(list).findByText('Dinner groceries')
    await userEvent.click(within(list).getByText('Lunch groceries'))
    const details = await within(list).findByRole('region', {
      name: 'Transaction',
    })
    const comment = within(details).getByRole('textbox', { name: 'Comment' })
    await userEvent.clear(comment)
    await userEvent.type(comment, 'Dinner groceries')
    await userEvent.tab()
    // The two saved operations now have identical editable fields. An invalid
    // draft still belongs to its own operation, independently of those fields.
    await userEvent.click(
      within(details).getByRole('combobox', { name: 'Transaction type' })
    )
    await userEvent.click(await body.findByRole('option', { name: 'Lent' }))
    expect(
      within(details).getByRole('combobox', { name: 'Transaction type' })
    ).toHaveTextContent('Lent')
    await userEvent.click(otherRow)
    await waitFor(() =>
      expect(
        within(details).getByRole('combobox', { name: 'Transaction type' })
      ).toHaveTextContent('Expense')
    )
  },
}

export const MissingSelectedRows: Story = {
  tags: ['check'],
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      canvas.getByRole('button', { name: 'Open explicit list' })
    )
    const list = await body.findByRole('dialog', {
      name: 'Explicit transactions',
    })
    await within(list).findByText('Lunch groceries')
    for (const checkbox of within(list).getAllByRole('checkbox'))
      await userEvent.click(checkbox)
    await waitFor(() =>
      expect(
        within(list).getByRole('button', {
          name: 'Remove Selected 2 transactions',
        })
      ).toBeVisible()
    )
    fireEvent.click(canvas.getByTestId('purge-dinner'))
    await waitFor(() =>
      expect(within(list).queryByText('Dinner groceries')).toBeNull()
    )
    expect(within(list).getByText('Lunch groceries')).toBeVisible()
    await waitFor(() =>
      expect(
        within(list).getByRole('button', {
          name: 'Remove Selected 1 transaction',
        })
      ).toBeVisible()
    )
  },
}

export const RapidRowsUseOneDetailsStep: Story = {
  tags: ['check'],
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      canvas.getByRole('button', { name: 'Open filtered list' })
    )
    const list = await body.findByRole('dialog', {
      name: 'Filtered transactions',
    })
    const lunch = await within(list).findByText('Lunch groceries')
    const dinner = within(list).getByText('Dinner groceries')
    fireEvent.click(lunch)
    fireEvent.click(dinner)
    const details = await within(list).findByRole('region', {
      name: 'Transaction',
    })
    await waitFor(() =>
      expect(
        within(details).getByRole('textbox', { name: 'Comment' })
      ).toHaveValue('Dinner groceries')
    )
    fireEvent.click(canvas.getByTestId('back'))
    await waitFor(() =>
      expect(
        within(list).queryByRole('region', { name: 'Transaction' })
      ).toBeNull()
    )
    expect(list).toBeVisible()
  },
}
