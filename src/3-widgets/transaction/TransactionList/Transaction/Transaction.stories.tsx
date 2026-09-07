import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ComponentProps } from 'react'
import { useState } from 'react'
import { core } from '@/zerro-core/redux'
import { useAppSelector } from '@/store'
import { Transaction } from './Transaction'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { useTransactionPreview } from '@/3-widgets/global/TransactionPreviewDrawer'

const meta = {
  title: 'App/Transactions/Transaction',
  component: Transaction,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    // Not `/transactions`: that page lays the preview screen out as a column
    // of its own, and this story wants the drawer the rest of the app gets.
    app: { scenario: 'demo', globalWidgets: true, route: '/budget' },
  },
  args: {
    isChecked: false,
    isOpened: false,
    isInSelectionMode: false,
  },
} satisfies Meta<typeof Transaction>

export default meta
type Story = StoryObj<Partial<ComponentProps<typeof Transaction>>>

export const Showcase: Story = {
  render: args => {
    const transactions = useAppSelector(core.transactions.selectAll)
    const ids = Object.keys(transactions).slice(0, 8)
    return (
      <div className="flex w-[560px] max-w-full flex-col gap-1">
        <p className="m-0 type-caption text-muted-foreground">
          Generated demo operations
        </p>
        {ids.map((id, index) => (
          <Transaction
            key={id}
            {...args}
            id={id}
            isOpened={index === 1}
            isInSelectionMode={index === 2}
            isChecked={index === 2}
          />
        ))}
      </div>
    )
  },
}

export const SelectionMode: Story = {
  args: { id: 'missing', isInSelectionMode: true, isChecked: true },
  render: args => {
    const id = Object.keys(useAppSelector(core.transactions.selectAll))[0]
    return (
      <Transaction
        isChecked={false}
        isOpened={false}
        isInSelectionMode={false}
        {...args}
        id={id}
      />
    )
  },
}

/** One expense, and everything about it the checks below assert on. The id is
 * captured once: an edit can stop it being an expense, and the harness has to
 * keep watching the same transaction when it does. */
function PreviewHarness() {
  const transactions = useAppSelector(core.transactions.selectAll)
  const getType = core.transactions.useType()
  const [id] = useState(
    () =>
      Object.values(transactions).find(
        tr => getType(tr) === 'outcome' && !!tr.tag?.length
      )!.id
  )
  const transaction = transactions[id]
  const preview = useTransactionPreview()
  return (
    <>
      <button type="button" onClick={() => preview(id)}>
        Edit expense
      </button>
      <output data-testid="expense">{transaction.outcome}</output>
      <output data-testid="type">{getType(transaction)}</output>
      <output data-testid="tags">{transaction.tag?.join(',') ?? ''}</output>
    </>
  )
}

export const AmountEditorRegression: Story = {
  render: () => <PreviewHarness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Edit expense' }))
    const input = await body.findByRole('textbox', { name: 'Amount' })
    await userEvent.click(input)
    await userEvent.clear(input)
    await userEvent.type(input, '25,5+4.5')
    await userEvent.click(await body.findByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(canvas.getByTestId('expense')).toHaveTextContent(/^30$/)
    )
  },
}

/** Changing the type rewrites both legs. A transfer carries no categories, so
 * saving one drops them — the draft keeps them, the transaction cannot. */
export const TypeSwitchRegression: Story = {
  render: () => <PreviewHarness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await expect(canvas.getByTestId('type')).toHaveTextContent(/^outcome$/)
    await userEvent.click(canvas.getByRole('button', { name: 'Edit expense' }))
    await userEvent.click(await body.findByRole('button', { name: /Expense/ }))
    await userEvent.click(
      await body.findByRole('menuitem', { name: 'Transfer' })
    )
    await userEvent.click(await body.findByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(canvas.getByTestId('type')).toHaveTextContent(/^transfer$/)
    )
    await expect(canvas.getByTestId('tags')).toHaveTextContent('')
  },
}
