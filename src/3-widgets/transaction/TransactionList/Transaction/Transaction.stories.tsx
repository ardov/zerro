import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ComponentProps } from 'react'
import { useState } from 'react'
import { core } from '@/zerro-core/redux'
import { useAppSelector } from '@/store'
import { Transaction } from './Transaction'
import { Accounts, Amounts } from './Transaction.Components'
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
        <p className="m-0 text-caption text-ui-secondary">
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
  play: async ({ canvasElement }) => {
    if (!('__vitest_browser_runner__' in window)) return
    const { page } = await import('vitest/browser')
    const rows = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('.transaction-line')
    )
      .filter((_, index) => index % 2 === 0)
      .map(line => line.parentElement!.parentElement!)
    const background = (row: HTMLElement) =>
      getComputedStyle(row, '::before').backgroundColor
    const selected = background(rows[1])
    for (const row of rows.slice(0, 2)) {
      const target = page.elementLocator(row)
      await target.hover()
      const hovered = background(row)
      if (row === rows[1]) expect(hovered).toBe(selected)
      let pressed = ''
      row.addEventListener(
        'mousedown',
        () => {
          pressed = background(row)
        },
        { once: true }
      )
      await target.click()
      expect(pressed).toBe(hovered)
      expect(background(row)).toBe(hovered)
      expect(getComputedStyle(row, '::before').transitionDuration).toBe('0s')
      expect(getComputedStyle(row, '::before').animationName).toBe('none')
    }
    await page.elementLocator(rows[0]).hover()
    expect(background(rows[1])).toBe(selected)
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
    await userEvent.tab()
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
    await userEvent.click(
      await body.findByRole('combobox', { name: 'Transaction type' })
    )
    await userEvent.click(await body.findByRole('option', { name: 'Transfer' }))
    await waitFor(() =>
      expect(canvas.getByTestId('type')).toHaveTextContent(/^transfer$/)
    )
    await expect(canvas.getByTestId('tags')).toHaveTextContent('')
  },
}

export const DirectionSeparators: Story = {
  render: function Render() {
    const transactions = useAppSelector(core.transactions.selectAll)
    const accounts = core.accounts.usePopulated()
    const ids = Object.keys(accounts)
    const tr = {
      ...Object.values(transactions)[0],
      outcomeAccount: ids[0],
      incomeAccount: ids[1],
      merchant: null,
      payee: 'Counterparty',
    }
    return (
      <div>
        {[
          core.transactions.TrType.Transfer,
          core.transactions.TrType.IncomeDebt,
          core.transactions.TrType.OutcomeDebt,
        ].map(trType => (
          <div key={trType} data-testid={trType}>
            <Accounts tr={tr} trType={trType} onPayeeClick={() => {}} />
          </div>
        ))}
        <div data-testid="equal-amounts">
          <Amounts
            tr={{
              ...tr,
              income: 10,
              outcome: 10,
              incomeInstrument: tr.outcomeInstrument,
            }}
            trType={core.transactions.TrType.Transfer}
          />
        </div>
        <div data-testid="missing-account">
          <Accounts
            tr={{ ...tr, outcomeAccount: null }}
            trType={core.transactions.TrType.OutcomeDebt}
            onPayeeClick={() => {}}
          />
        </div>
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    for (const type of ['transfer', 'incomeDebt', 'outcomeDebt']) {
      const row = canvas.getByTestId(type)
      const arrow = row.querySelector<SVGSVGElement>('svg')!
      expect(arrow).toBeVisible()
      expect(arrow.getBoundingClientRect().width).toBe(16)
      expect(arrow.getBoundingClientRect().height).toBe(16)
      // Lucide preserves the standard 1.5px stroke at 16px.
      expect(arrow).toHaveAttribute('stroke-width', '2.25')
      const before = arrow.previousElementSibling!.getBoundingClientRect()
      const after = arrow.nextElementSibling!.getBoundingClientRect()
      expect(arrow.getBoundingClientRect().left - before.right).toBeCloseTo(4)
      expect(after.left - arrow.getBoundingClientRect().right).toBeCloseTo(4)
      if (type !== 'transfer')
        expect(
          within(row).getByRole('button', { name: 'Counterparty' })
        ).toBeVisible()
    }
    expect(canvas.getByTestId('equal-amounts').querySelector('svg')).toBeNull()
    expect(
      canvas.getByTestId('missing-account').querySelector('svg')
    ).not.toBeVisible()
  },
}
