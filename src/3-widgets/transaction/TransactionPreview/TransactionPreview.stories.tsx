import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { useMemo } from 'react'
import { useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'
import type { TTransaction } from '@/6-shared/types'
import { TransactionPreview, TrEmptyState } from '.'

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
  <div className="rounded-lg bg-card text-card-foreground shadow-elevation-1 w-[360px] overflow-y-auto">
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
    expect(canvas.queryByRole('button', { name: 'Place' })).toBeNull()

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
    await userEvent.click(await canvas.findByRole('button', { name: 'Place' }))

    const list = await body.findByRole('listbox')
    const search = await body.findByRole('combobox', { name: 'Find or create' })
    const field = search.closest('[data-slot="filled-field"]')!
    // The surface arrives scaled, so nothing is measured until it has settled:
    // a rect read mid-entrance is not the layout.
    const surface = field.closest('.scroll-fade')!
    await waitFor(() =>
      expect(getComputedStyle(surface).transform).toBe('none')
    )
    await waitFor(() =>
      expect(list.scrollHeight).toBeGreaterThan(list.clientHeight)
    )

    const rowTop = () =>
      within(list).getAllByRole('option')[0].getBoundingClientRect().top
    const fieldBox = () => field.getBoundingClientRect()

    // Everything stays inside the paper, and the search sits above the rows
    // rather than over them.
    const paper = surface.getBoundingClientRect()
    expect(fieldBox().top).toBeGreaterThanOrEqual(paper.top)
    expect(list.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      paper.bottom + 1
    )
    expect(fieldBox().bottom).toBeLessThanOrEqual(rowTop() + 1)

    // Scrolling the rows leaves the search where it was, and the top of the
    // list comes back.
    const before = fieldBox().top
    list.scrollTop = list.scrollHeight
    await waitFor(() => expect(fieldBox().top).toBeCloseTo(before, 0))
    // Rows running off the top are faded there, not cut.
    await waitFor(() => expect(list.dataset.fade).toBe('top'))
    list.scrollTop = 0
    await waitFor(() =>
      expect(fieldBox().bottom).toBeLessThanOrEqual(rowTop() + 1)
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
