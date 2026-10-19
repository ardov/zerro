import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test'
import { useNavigate } from 'react-router-dom'
import {
  transactionScreen,
  useTransactionPreview,
} from './TransactionPreviewDrawer'
import TransactionsView from '@/2-pages/Transactions'
import { Button } from '@/6-shared/ui/kit/Button'
import { useTransactionDrawer } from './TransactionListDrawer'
import { useEnvTransactionsDrawer } from './EnvTransactionsDrawer'

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
      <output aria-label="Page transaction">{pageTransaction ?? 'none'}</output>
      <Button onClick={() => openPagePreview('other')}>
        Open page preview
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
      <div className="flex h-[700px] gap-2">
        <TransactionsView />
      </div>
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
    const preview = await body.findByRole('dialog', { name: 'Transaction' })
    expect(preview).toBeVisible()
    expect(list).toBeInTheDocument()
    expect(canvas.getByLabelText('Page transaction')).toHaveTextContent(
      existing ? 'other' : 'none'
    )
    // Simulate browser history through the story's MemoryRouter, even while
    // modal focus correctly makes the page controls inaccessible to a user.
    fireEvent.click(canvas.getByTestId('back'))
    await waitFor(() => expect(preview).not.toBeInTheDocument())
    expect(list).toBeVisible()
    fireEvent.click(canvas.getByTestId('forward'))
    const restored = await body.findByRole('dialog', { name: 'Transaction' })
    expect(restored).toBeVisible()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(restored).not.toBeInTheDocument())
    expect(list).toBeVisible()
    await userEvent.click(within(list).getByText('Dinner groceries'))
    const another = await body.findByRole('dialog', { name: 'Transaction' })
    expect(another).toBeVisible()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(another).not.toBeInTheDocument())
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
