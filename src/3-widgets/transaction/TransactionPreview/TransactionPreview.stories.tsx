import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { useMemo } from 'react'
import { useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'
import type { TTransaction } from '@/6-shared/types'
import { TransactionPreview, TrEmptyState } from '.'
import { AccountField } from './AccountField'

const meta = {
  title: 'App/Transactions/TransactionPreview',
  component: TransactionPreview,
  parameters: {
    layout: 'centered',
    // The editor is a screen, so it wants the store and the overlay host the
    // application gives it. Not `/transactions`: that page lays this screen
    // out as a column of its own.
    app: { scenario: 'demo', route: '/budget' },
  },
} satisfies Meta<typeof TransactionPreview>

export default meta
type Story = StoryObj<typeof meta>

/** The demo store's first transaction of each type, so every story below is
 * about a real one rather than a shape assembled for the picture. */
function useByType() {
  const transactions = useAppSelector(core.transactions.selectAll)
  const debtAccountId = useAppSelector(core.accounts.selectDebtAccountId)
  return useMemo(() => {
    const found: Partial<Record<string, TTransaction>> = {}
    Object.values(transactions).forEach(tr => {
      const type = core.transactions.getType(tr, debtAccountId)
      if (!found[type] && !tr.deleted) found[type] = tr
    })
    return found
  }, [transactions, debtAccountId])
}

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div className="w-90 overflow-y-auto rounded-ui-card rounded-smooth bg-ui-card text-ui-primary shadow-ui-popover">
    {children}
  </div>
)

export const Bench: Story = {
  args: { id: '', onClose: () => {}, onOpenOther: () => {} },
  render: args => {
    const outcome = useByType().outcome
    return (
      <Frame>
        {outcome ? (
          <TransactionPreview {...args} id={outcome.id} />
        ) : (
          <TrEmptyState />
        )}
      </Frame>
    )
  },
}

export const Showcase: Story = {
  args: { id: '', onClose: () => {}, onOpenOther: () => {} },
  render: args => {
    const byType = useByType()
    const shown = ['outcome', 'income', 'transfer'] as const
    return (
      <div className="flex items-start gap-4">
        {shown.map(type => {
          const tr = byType[type]
          return (
            <Frame key={type}>
              {tr ? (
                <TransactionPreview {...args} id={tr.id} key={tr.id} />
              ) : (
                <TrEmptyState />
              )}
            </Frame>
          )
        })}
      </div>
    )
  },
}

/** Transfers have no counterparty place: their two accounts describe both sides. */
export const Transfer: Story = {
  args: { id: '', onClose: () => {}, onOpenOther: () => {} },
  render: args => {
    const transfer = useByType().transfer
    return (
      <Frame>
        {transfer ? (
          <TransactionPreview {...args} id={transfer.id} />
        ) : (
          <TrEmptyState />
        )}
      </Frame>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.queryByRole('combobox', { name: 'Place' })).toBeNull()
    const body = within(canvasElement.ownerDocument.body)
    const from = canvas.getByRole('combobox', { name: /^From account/ })
    const to = canvas.getByRole('combobox', { name: /^To account/ })
    const excludedTitle = to.textContent?.trim()
    await userEvent.click(from)
    await body.findByRole('listbox')
    expect(excludedTitle).toBeTruthy()
    expect(
      body
        .getAllByRole('option')
        .some(option => option.textContent?.startsWith(excludedTitle!))
    ).toBe(false)
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(from).toHaveFocus())

    const amount = canvas.getByRole<HTMLInputElement>('textbox', {
      name: 'Amount taken',
    })
    await userEvent.click(amount)
    await userEvent.clear(amount)
    await userEvent.type(amount, '12345')
    expect(amount.value).toBe('12\u00a0345')

    amount.setSelectionRange(4, 4)
    await userEvent.type(amount, '0', { skipClick: true })
    expect(amount.value).toBe('123\u00a0045')
    expect(amount.selectionStart).toBe(5)
    expect(amount.selectionEnd).toBe(5)
  },
}

/** Nothing selected. */
export const Empty: Story = {
  args: { id: 'missing', onClose: () => {}, onOpenOther: () => {} },
  render: args => (
    <Frame>
      <TransactionPreview {...args} />
    </Frame>
  ),
}

/** The merchant picker with more rows than it can show: the search keeps its
 * place at the top and the list is the only thing that scrolls. */
export const MerchantPicker: Story = {
  tags: ['!dev', '!autodocs'],
  args: { id: '', onClose: () => {}, onOpenOther: () => {} },
  render: args => {
    const outcome = useByType().outcome
    return (
      <Frame>
        {outcome && <TransactionPreview {...args} id={outcome.id} />}
      </Frame>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(document.body)
    await userEvent.click(
      await canvas.findByRole('combobox', { name: /^Place/ })
    )
    const search = await body.findByRole('combobox', { name: 'Find or create' })
    await userEvent.clear(search)
    const showAll = body.queryByRole('button', { name: 'Show all' })
    if (showAll) await userEvent.click(showAll)
    const list = await body.findByRole('listbox')
    // Find the scroll owner by behavior rather than the old field's CSS classes.
    let scroller = list
    while (
      getComputedStyle(scroller).overflowY !== 'auto' &&
      scroller.parentElement
    ) {
      scroller = scroller.parentElement
    }
    await waitFor(() =>
      expect(scroller.scrollHeight).toBeGreaterThan(scroller.clientHeight)
    )
    const before = search.getBoundingClientRect().top
    scroller.scrollTop = scroller.scrollHeight
    await waitFor(() => expect(scroller.scrollTop).toBeGreaterThan(0))
    await expect(search.getBoundingClientRect().top).toBeCloseTo(before, 0)
    await expect(search).toBeVisible()
    scroller.scrollTop = 0
    await waitFor(() =>
      expect(
        within(list).getAllByRole('option')[0].getBoundingClientRect().top
      ).toBeGreaterThanOrEqual(search.getBoundingClientRect().bottom)
    )
  },
}

/** Viewed state applies immediately, but it is metadata beside the editable
 * draft and must not replace unsaved field work. */
export const MarkNewPreservesDraft: Story = {
  tags: ['!dev', '!autodocs'],
  args: { id: '', onClose: () => {}, onOpenOther: () => {} },
  render: args => {
    const outcome = useByType().outcome
    return (
      <Frame>
        {outcome && <TransactionPreview {...args} id={outcome.id} />}
      </Frame>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const comment = await canvas.findByRole<HTMLInputElement>('textbox', {
      name: 'Comment',
    })
    await userEvent.type(comment, ' unsaved draft')
    const draft = comment.value

    await userEvent.click(canvas.getByRole('button', { name: 'More' }))
    const action = await body.findByRole('menuitem', {
      name: /Mark as (new|viewed)/,
    })
    await userEvent.click(action)

    await waitFor(() => expect(comment).toHaveValue(draft))
  },
}

/** Switching the type replaces the field layout without losing the draft. */
export const ChangeTypePreservesDraft: Story = {
  ...Bench,
  tags: ['check'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const comment = canvas.getByRole<HTMLTextAreaElement>('textbox', {
      name: 'Comment',
    })
    await userEvent.type(comment, ' Keep this draft')
    const draft = comment.value
    const type = canvas.getByRole('combobox', { name: 'Transaction type' })
    await userEvent.click(type)
    await userEvent.click(await body.findByRole('option', { name: 'Transfer' }))
    await waitFor(() => expect(type).toHaveFocus())
    expect(
      canvas.getByRole('combobox', { name: /^From account/ })
    ).toBeInTheDocument()
    expect(
      canvas.getByRole('textbox', { name: 'Amount taken' })
    ).toBeInTheDocument()
    expect(comment).toHaveValue(draft)
    await userEvent.click(type)
    await userEvent.click(await body.findByRole('option', { name: 'Expense' }))
    await waitFor(() => expect(type).toHaveFocus())
    expect(canvas.getByRole('textbox', { name: 'Amount' })).toBeInTheDocument()
    expect(comment).toHaveValue(draft)
  },
}

export const EmptyAccount: StoryObj = {
  render: () => <AccountField label="Account" value="" onChange={() => {}} />,
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('combobox', {
      name: 'Account',
    })
    await expect(trigger.querySelector('[id$="-value"]')).toHaveTextContent(
      'Account'
    )
    await userEvent.click(trigger)
    await expect(
      await within(canvasElement.ownerDocument.body).findByRole('listbox')
    ).toBeVisible()
    await userEvent.keyboard('{Escape}')
  },
}
