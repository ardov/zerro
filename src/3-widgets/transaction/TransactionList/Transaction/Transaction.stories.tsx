import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ComponentProps } from 'react'
import { core } from 'zerro-core/redux'
import { useAppSelector } from 'store'
import { Transaction } from './Transaction'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { useTransactionPreview } from '3-widgets/global/TransactionPreviewDrawer'

const meta = {
  title: 'Finance/Transaction',
  component: Transaction,
  parameters: {
    layout: 'centered',
    app: { scenario: 'demo', globalWidgets: true, route: '/transactions' },
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

function PreviewHarness() {
  const transactions = useAppSelector(core.transactions.selectAll)
  const transaction = Object.values(transactions).find(
    tr => core.transactions.getType(tr) === 'outcome'
  )!
  const preview = useTransactionPreview()
  return (
    <>
      <button
        type="button"
        onClick={() => preview.open({ id: transaction.id })}
      >
        Edit expense
      </button>
      <output data-testid="expense">{transaction.outcome}</output>
    </>
  )
}

export const AmountEditorRegression: Story = {
  render: () => <PreviewHarness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Edit expense' }))
    const input = await body.findByRole('textbox', { name: /Expense from / })
    await expect(input.getBoundingClientRect().height).toBe(40)
    await userEvent.click(input)
    await userEvent.clear(input)
    await userEvent.type(input, '25,5+4.5')
    await userEvent.click(await body.findByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(canvas.getByTestId('expense')).toHaveTextContent(/^30$/)
    )
  },
}
