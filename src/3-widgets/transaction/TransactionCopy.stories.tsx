import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test'
import { Layout } from '@/1-app/Layout'
import { pageColumns } from '@/1-app/pageColumns'
import TransactionsView from '@/2-pages/Transactions'
import type { TTransaction } from '@/6-shared/types'
import { useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'

function CopyScenario() {
  const transactions = useAppSelector(core.transactions.selectAll)
  return (
    <>
      <output hidden data-testid="transactions">
        {JSON.stringify(transactions)}
      </output>
      <Layout navigation columns={pageColumns.transactions}>
        <TransactionsView />
      </Layout>
    </>
  )
}

const meta = {
  title: 'App/Transactions/Copy',
  tags: ['check'],
  parameters: {
    layout: 'fullscreen',
    historyShortcuts: true,
    app: {
      scenario: 'transaction-filters',
      globalWidgets: true,
      route: '/transactions',
    },
  },
  render: () => <CopyScenario />,
} satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

const checkCopy =
  (entry: 'preview' | 'context'): Story['play'] =>
  async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const readTransactions = (): Record<string, TTransaction> =>
      JSON.parse(canvas.getByTestId('transactions').textContent!)
    const row = await canvas.findByText('Lunch groceries')
    if (entry === 'preview') await userEvent.click(row)

    const before = readTransactions()
    const source = before.lunch
    const openCopy = async () => {
      if (entry === 'preview') {
        await userEvent.click(body.getByRole('button', { name: 'More' }))
      } else {
        fireEvent.contextMenu(row, { clientX: 150, clientY: 250 })
      }
      const action = await waitFor(() => {
        const item =
          body.queryByRole('menuitem', { name: 'Copy' }) ??
          body.queryByRole('button', { name: 'Copy' })
        expect(item).not.toBeNull()
        return item!
      })
      await userEvent.click(action)
      return within(
        await body.findByRole('dialog', { name: 'New transaction' })
      )
    }

    let form = await openCopy()
    expect(form.getByRole('textbox', { name: 'Amount' })).toHaveValue('12')
    expect(form.getByRole('combobox', { name: /^Account / })).toHaveTextContent(
      'HSBC USD'
    )
    expect(form.getByRole('combobox', { name: /^Place/ })).toHaveTextContent(
      'Lidl'
    )
    expect(form.getByLabelText('Date', { exact: true })).toHaveValue(
      source.date
    )
    expect(form.getByRole('textbox', { name: 'Comment' })).toHaveValue(
      source.comment
    )
    expect(readTransactions()).toEqual(before)

    await userEvent.clear(form.getByRole('textbox', { name: 'Comment' }))
    await userEvent.type(
      form.getByRole('textbox', { name: 'Comment' }),
      'Discard this draft'
    )
    await userEvent.keyboard('{Alt>}{ArrowLeft}{/Alt}')
    await waitFor(() =>
      expect(body.queryByRole('dialog', { name: 'New transaction' })).toBeNull()
    )
    expect(readTransactions()).toEqual(before)

    form = await openCopy()
    expect(form.getByRole('textbox', { name: 'Comment' })).toHaveValue(
      source.comment
    )
    await userEvent.clear(form.getByRole('textbox', { name: 'Comment' }))
    await userEvent.type(
      form.getByRole('textbox', { name: 'Comment' }),
      'Copied groceries'
    )
    await userEvent.click(
      form.getByRole('button', { name: 'Create transaction' })
    )
    await waitFor(() =>
      expect(body.queryByRole('dialog', { name: 'New transaction' })).toBeNull()
    )

    const after = readTransactions()
    const created = Object.values(after).filter(tr => !before[tr.id])
    expect(created).toHaveLength(1)
    expect(after.lunch).toEqual(source)
    expect(created[0]).toMatchObject({
      income: source.income,
      outcome: source.outcome,
      incomeAccount: source.incomeAccount,
      outcomeAccount: source.outcomeAccount,
      date: source.date,
      merchant: source.merchant,
      payee: source.payee,
      tag: source.tag,
      comment: 'Copied groceries',
      deleted: false,
      viewed: true,
    })
  }

export const Preview: Story = {
  globals: { viewport: { value: 'zerro900' } },
  play: checkCopy('preview'),
}

export const ContextMenu: Story = {
  globals: { viewport: { value: 'zerro900' } },
  play: checkCopy('context'),
}

export const MobilePreview: Story = {
  ...Preview,
  globals: { viewport: { value: 'zerro499' } },
}

export const MobileContextMenu: Story = {
  ...ContextMenu,
  globals: { viewport: { value: 'zerro499' } },
}
