import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  expect,
  fireEvent,
  fn,
  userEvent,
  waitFor,
  within,
} from 'storybook/test'
import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import { undoClientCommand, redoClientCommand } from '@/store/data'
import { core } from '@/zerro-core/redux'
import type { TTransaction } from '@/6-shared/types'
import { TransactionPreview, TrEmptyState } from '.'
import {
  TransactionPreviewDrawer,
  useTransactionPreview,
} from '@/3-widgets/global/TransactionPreviewDrawer'
import { AccountField } from './AccountField'
import TransactionsView from '@/2-pages/Transactions'

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
  const [ids] = useState(() => {
    const found: Record<string, string> = {}
    Object.values(transactions).forEach(tr => {
      const type = core.transactions.getType(tr, debtAccountId)
      if (!found[type] && !tr.deleted) found[type] = tr.id
    })
    return found
  })
  return Object.fromEntries(
    Object.entries(ids).map(([type, id]) => [type, transactions[id]])
  ) as Partial<Record<string, TTransaction>>
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
    const [id, setId] = useState(() => outcome?.id)
    return (
      <Frame>
        {id ? (
          <TransactionPreview
            {...args}
            id={id}
            onOpenOther={next => {
              setId(next)
              args.onOpenOther(next)
            }}
          />
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

/** A synthetic fiscal receipt and location on a demo transaction. The map uses
 * the same Google embed as the app and needs network access. */
export const ReceiptAndMap: Story = {
  ...Bench,
  parameters: { app: { scenario: 'receipt-and-map', route: '/budget' } },
  render: args => {
    const transactions = useAppSelector(core.transactions.selectAll)
    const transaction = Object.values(transactions).find(tr => tr.qrCode)
    return (
      <Frame>
        {transaction ? (
          <TransactionPreview {...args} id={transaction.id} />
        ) : (
          <TrEmptyState />
        )}
      </Frame>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.getByTitle('geo')).toHaveAttribute(
      'src',
      expect.stringContaining('37.6173')
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Show more' }))
    await expect(canvas.getByText('9287440301110113')).toBeVisible()
  },
}

function ModalSaveHarness({ docked = false }: { docked?: boolean }) {
  const outcome = useByType().outcome
  const open = useTransactionPreview()
  const transactions = useAppSelector(core.transactions.selectAll)
  const saved = Object.values(transactions).find(
    tr => tr.comment === 'Saved from modal' && !tr.deleted
  )
  return (
    <>
      <button onClick={() => open(saved?.id ?? outcome!.id)}>
        Edit transaction
      </button>
      <output aria-label="Saved comment">{saved?.comment}</output>
      <output aria-label="Saved time">
        {saved
          ? new Date(saved.created).getHours() +
            ':' +
            new Date(saved.created).getMinutes()
          : ''}
      </output>
      {docked && (
        <div className="flex h-[700px] gap-2">
          <TransactionsView />
        </div>
      )}
      <TransactionPreviewDrawer />
    </>
  )
}

function checkModalSave(changeTime: boolean): Story['play'] {
  return async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole('button', { name: 'Edit transaction' })
    await userEvent.click(trigger)
    const dialog = await body.findByRole('dialog', { name: 'Transaction' })
    const editor = within(dialog)
    const comment = editor.getByRole('textbox', { name: 'Comment' })
    await userEvent.clear(comment)
    await userEvent.type(comment, 'Saved from modal')
    await userEvent.click(editor.getByLabelText('Time'))
    if (changeTime) {
      fireEvent.change(editor.getByLabelText('Time'), {
        target: { value: '13:37' },
      })
    }
    await userEvent.tab()
    await expect(dialog).toBeInTheDocument()
    await expect(editor.queryByRole('button', { name: 'Save' })).toBeNull()
    await expect(canvas.getByLabelText('Saved comment')).toHaveTextContent(
      'Saved from modal'
    )
    if (changeTime)
      await expect(canvas.getByLabelText('Saved time')).toHaveTextContent(
        '13:37'
      )
    await userEvent.click(
      within(dialog).getAllByRole('button', { name: 'Close' })[0]
    )
    await waitFor(() => expect(dialog).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
  }
}

export const ModalSave: Story = {
  ...Bench,
  render: () => <ModalSaveHarness />,
  play: checkModalSave(false),
}
export const ModalSaveWithChangedTime: Story = {
  ...ModalSave,
  play: checkModalSave(true),
}
export const MobileModalSave: Story = {
  ...ModalSave,
  globals: { viewport: { value: 'zerro499' } },
}
export const InlineSaveStaysOpen: Story = {
  ...Bench,
  args: { id: '', onClose: fn(), onOpenOther: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const comment = canvas.getByRole('textbox', { name: 'Comment' })
    await userEvent.clear(comment)
    await userEvent.type(comment, 'Saved inline')
    await userEvent.tab()
    await waitFor(() =>
      expect(
        canvas.queryByRole('button', { name: 'Save' })
      ).not.toBeInTheDocument()
    )
    await expect(comment).toBeVisible()
    await expect(comment).toHaveValue('Saved inline')
    await expect(args.onClose).not.toHaveBeenCalled()
  },
}

function InlineRecreateHarness() {
  const outcome = useByType().outcome!
  const [id, setId] = useState(() => outcome.id)
  const [initialId] = useState(id)
  return (
    <>
      <output aria-label="Operation replaced">
        {String(id !== initialId)}
      </output>
      {id && (
        <Frame>
          <TransactionPreview
            id={id}
            onClose={() => setId('')}
            onOpenOther={setId}
          />
        </Frame>
      )}
    </>
  )
}

export const InlineSaveWithChangedTime: Story = {
  ...Bench,
  render: () => <InlineRecreateHarness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const comment = canvas.getByRole('textbox', { name: 'Comment' })
    await userEvent.clear(comment)
    await userEvent.type(comment, 'Recreated inline')
    await userEvent.click(canvas.getByLabelText('Time'))
    fireEvent.change(canvas.getByLabelText('Time'), {
      target: { value: '13:37' },
    })
    await userEvent.tab()
    await waitFor(() =>
      expect(canvas.getByLabelText('Operation replaced')).toHaveTextContent(
        'true'
      )
    )
    await expect(canvas.getByRole('textbox', { name: 'Comment' })).toHaveValue(
      'Recreated inline'
    )
    await expect(canvas.getByLabelText('Time')).toHaveValue('13:37')
    await expect(
      canvas.queryByRole('button', { name: 'Save' })
    ).not.toBeInTheDocument()
  },
}

/** Watches the same entity and the real undo stack across autosaves. */
function AutosaveHarness({
  type = 'outcome',
}: {
  type?: 'outcome' | 'transfer'
}) {
  const transactions = useAppSelector(core.transactions.selectAll)
  const getType = core.transactions.useType()
  const [id, setId] = useState(
    () =>
      Object.values(transactions).find(
        tr => !tr.deleted && getType(tr) === type && !tr.payee
      )?.id ??
      Object.values(transactions).find(
        tr => !tr.deleted && getType(tr) === type
      )!.id
  )
  const transaction = transactions[id]
  const count = useAppSelector(state => state.data.outbox.length)
  const dispatch = useAppDispatch()
  const [open, setOpen] = useState(true)
  return (
    <>
      <button onClick={() => setOpen(true)}>Reopen</button>
      <button onClick={() => dispatch(undoClientCommand())}>Undo edit</button>
      <button onClick={() => dispatch(redoClientCommand())}>Redo edit</button>
      <output aria-label="Command count">{count}</output>
      <output aria-label="Stored transaction">
        {JSON.stringify(transaction)}
      </output>
      <output aria-label="Stored type">{getType(transaction)}</output>
      {open && (
        <Frame>
          <TransactionPreview
            id={id}
            onClose={() => setOpen(false)}
            onOpenOther={setId}
          />
        </Frame>
      )}
    </>
  )
}

function stored(canvas: ReturnType<typeof within>): TTransaction {
  return JSON.parse(canvas.getByLabelText('Stored transaction').textContent!)
}

export const FinishedFieldsAndUndo: Story = {
  ...Bench,
  tags: ['check'],
  render: () => <AutosaveHarness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const original = stored(canvas)
    const count = Number(canvas.getByLabelText('Command count').textContent)
    const comment = canvas.getByRole('textbox', { name: 'Comment' })
    await userEvent.clear(comment)
    await userEvent.type(comment, 'One finished edit')
    expect(stored(canvas).comment).toBe(original.comment)
    expect(canvas.getByLabelText('Command count')).toHaveTextContent(
      String(count)
    )
    const amount = canvas.getByRole('textbox', { name: 'Amount' })
    await userEvent.click(amount)
    await waitFor(() =>
      expect(stored(canvas).comment).toBe('One finished edit')
    )
    expect(Number(canvas.getByLabelText('Command count').textContent)).toBe(
      count + 1
    )
    await userEvent.clear(amount)
    await userEvent.type(amount, '25+5')
    expect(stored(canvas).outcome).toBe(original.outcome)
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(stored(canvas).outcome).toBe(30))
    expect(Number(canvas.getByLabelText('Command count').textContent)).toBe(
      count + 2
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Undo edit' }))
    await waitFor(() => expect(stored(canvas).outcome).toBe(original.outcome))
    expect(stored(canvas).comment).toBe('One finished edit')
    await userEvent.click(canvas.getByRole('button', { name: 'Redo edit' }))
    await waitFor(() => expect(stored(canvas).outcome).toBe(30))
    await userEvent.click(amount)
    await userEvent.clear(amount)
    await userEvent.tab()
    await waitFor(() => expect(amount).toHaveValue('30'))
    expect(Number(canvas.getByLabelText('Command count').textContent)).toBe(
      count + 2
    )
    await userEvent.click(amount)
    await userEvent.clear(amount)
    await userEvent.type(amount, '10-20{Enter}')
    await waitFor(() => expect(amount).toHaveValue('30'))
    expect(stored(canvas).outcome).toBe(30)
    expect(Number(canvas.getByLabelText('Command count').textContent)).toBe(
      count + 2
    )
    expect(canvas.queryByRole('button', { name: 'Save' })).toBeNull()
  },
}

export const DebtWaitsForCounterparty: Story = {
  ...Bench,
  tags: ['check'],
  render: () => <AutosaveHarness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    // Ensure a nameless expense even when the demo starts with a merchant.
    if (stored(canvas).payee) {
      await userEvent.click(canvas.getByRole('combobox', { name: /^Place/ }))
      await userEvent.click(await body.findByRole('option', { name: 'Clear' }))
    }
    const count = Number(canvas.getByLabelText('Command count').textContent)
    const chooseDebt = async () => {
      await userEvent.click(
        canvas.getByRole('combobox', { name: 'Transaction type' })
      )
      await userEvent.click(await body.findByRole('option', { name: 'Lent' }))
      await waitFor(() => expect(body.queryByRole('listbox')).toBeNull())
    }
    await chooseDebt()
    expect(canvas.getByLabelText('Stored type')).toHaveTextContent('outcome')
    expect(Number(canvas.getByLabelText('Command count').textContent)).toBe(
      count
    )
    expect(
      canvas.getByRole('combobox', { name: /^Who owes/ })
    ).not.toHaveFocus()
    await userEvent.click(canvas.getByRole('button', { name: 'Close' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Reopen' }))
    expect(
      canvas.getByRole('combobox', { name: 'Transaction type' })
    ).toHaveTextContent('Expense')
    await chooseDebt()
    await userEvent.click(canvas.getByRole('combobox', { name: /^Who owes/ }))
    const search = await body.findByRole('combobox', { name: 'Find or create' })
    await userEvent.clear(search)
    await userEvent.type(search, 'Autosave debtor')
    await userEvent.click(
      await body.findByRole('option', { name: /Create.*Autosave debtor/ })
    )
    await waitFor(() =>
      expect(canvas.getByLabelText('Stored type')).toHaveTextContent(
        'outcomeDebt'
      )
    )
    expect(stored(canvas).payee).toBe('Autosave debtor')
    expect(Number(canvas.getByLabelText('Command count').textContent)).toBe(
      count + 1
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Undo edit' }))
    await waitFor(() =>
      expect(canvas.getByLabelText('Stored type')).toHaveTextContent('outcome')
    )
    expect(stored(canvas).payee).toBeFalsy()
  },
}

export const DismissActiveComment: Story = {
  ...ModalSave,
  tags: ['check'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      canvas.getByRole('button', { name: 'Edit transaction' })
    )
    const dialog = await body.findByRole('dialog', { name: 'Transaction' })
    const comment = within(dialog).getByRole('textbox', { name: 'Comment' })
    await userEvent.clear(comment)
    await userEvent.type(comment, 'Saved from modal')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(dialog).not.toBeInTheDocument())
    expect(canvas.getByLabelText('Saved comment')).toHaveTextContent(
      'Saved from modal'
    )
  },
}

export const BackFinishesActiveComment: Story = {
  ...DismissActiveComment,
  parameters: { historyShortcuts: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      canvas.getByRole('button', { name: 'Edit transaction' })
    )
    const dialog = await body.findByRole('dialog', { name: 'Transaction' })
    const comment = within(dialog).getByRole('textbox', { name: 'Comment' })
    await userEvent.clear(comment)
    await userEvent.type(comment, 'Saved from modal')
    await userEvent.keyboard('{Alt>}{ArrowLeft}{/Alt}')
    await waitFor(() => expect(dialog).not.toBeInTheDocument())
    expect(canvas.getByLabelText('Saved comment')).toHaveTextContent(
      'Saved from modal'
    )
  },
}

export const DateAndTimeFinishOnce: Story = {
  ...Bench,
  tags: ['check'],
  render: () => <AutosaveHarness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const count = Number(canvas.getByLabelText('Command count').textContent)
    const original = stored(canvas)
    const date = canvas.getByLabelText('Date')
    const time = canvas.getByLabelText('Time')
    await userEvent.click(date)
    fireEvent.change(date, { target: { value: '2026-09-15' } })
    fireEvent.change(date, { target: { value: '2026-09-16' } })
    expect(stored(canvas).date).toBe(original.date)
    await userEvent.click(time)
    await waitFor(() => expect(stored(canvas).date).toBe('2026-09-16'))
    expect(Number(canvas.getByLabelText('Command count').textContent)).toBe(
      count + 1
    )
    fireEvent.change(time, { target: { value: '' } })
    await userEvent.click(date)
    expect(stored(canvas).created).toBe(original.created)
    expect(Number(canvas.getByLabelText('Command count').textContent)).toBe(
      count + 1
    )
    await userEvent.click(time)
    fireEvent.change(time, { target: { value: '13:30' } })
    fireEvent.change(time, { target: { value: '13:37' } })
    expect(stored(canvas).created).toBe(original.created)
    await userEvent.tab()
    await waitFor(() => expect(stored(canvas).id).not.toBe(original.id))
    expect(Number(canvas.getByLabelText('Command count').textContent)).toBe(
      count + 2
    )
  },
}

export const TransferAmountsAutosave: Story = {
  ...Bench,
  tags: ['check'],
  render: () => <AutosaveHarness type="transfer" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const original = stored(canvas)
    const count = Number(canvas.getByLabelText('Command count').textContent)
    const from = canvas.getByRole('textbox', { name: 'Amount taken' })
    const to = canvas.getByRole('textbox', { name: 'Amount received' })
    await userEvent.clear(from)
    await userEvent.click(to)
    expect(stored(canvas).outcome).toBe(original.outcome)
    expect(stored(canvas).income).toBe(original.income)
    expect(Number(canvas.getByLabelText('Command count').textContent)).toBe(
      count
    )
    await userEvent.clear(to)
    await userEvent.type(to, '150{Enter}')
    await waitFor(() => expect(stored(canvas).income).toBe(150))
    expect(Number(canvas.getByLabelText('Command count').textContent)).toBe(
      count + 1
    )
    await userEvent.clear(from)
    await userEvent.type(from, '300{Enter}')
    await waitFor(() => expect(stored(canvas).outcome).toBe(300))
    expect(Number(canvas.getByLabelText('Command count').textContent)).toBe(
      count + 2
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Undo edit' }))
    expect(stored(canvas).outcome).toBe(original.outcome)
    expect(stored(canvas).income).toBe(150)
  },
}

export const DockedBackFinishesInput: Story = {
  ...Bench,
  tags: ['check'],
  parameters: {
    layout: 'fullscreen',
    app: { scenario: 'demo', route: '/transactions' },
    historyShortcuts: true,
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
  render: () => <ModalSaveHarness docked />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByRole('button', { name: 'Edit transaction' })
    )
    const comment = await canvas.findByRole('textbox', { name: 'Comment' })
    await userEvent.clear(comment)
    await userEvent.type(comment, 'Saved from modal')
    expect(canvas.getByLabelText('Saved comment')).toHaveTextContent('')
    await userEvent.keyboard('{Alt>}{ArrowLeft}{/Alt}')
    await waitFor(() => expect(comment).not.toBeInTheDocument())
    expect(canvas.getByLabelText('Saved comment')).toHaveTextContent(
      'Saved from modal'
    )
  },
}

/** An inactive drawer must forget the editor that its adaptive branch removed. */
export const AdaptiveRemountDiscardsPendingEdit: Story = {
  ...DockedBackFinishesInput,
  tags: ['check', '!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    // Resizing the real browser exercises both owners and their media queries.
    // The interactive Storybook canvas has no test-browser viewport controller.
    if (!('__vitest_browser_runner__' in window)) return
    const { page } = await import('vitest/browser')
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const originalWidth = window.innerWidth
    const originalHeight = window.innerHeight
    try {
      for (const closeWhileDocked of [false, true]) {
        await page.viewport(900, 900)
        await userEvent.click(
          canvas.getByRole('button', { name: 'Edit transaction' })
        )
        const dialog = await body.findByRole('dialog', { name: 'Transaction' })
        const comment = within(dialog).getByRole<HTMLTextAreaElement>(
          'textbox',
          { name: 'Comment' }
        )
        const originalComment = comment.value
        await userEvent.clear(comment)
        await userEvent.type(comment, 'Saved from modal')
        expect(canvas.getByLabelText('Saved comment')).toBeEmptyDOMElement()

        await page.viewport(1440, 900)
        await waitFor(() =>
          expect(body.queryByRole('dialog', { name: 'Transaction' })).toBeNull()
        )
        expect(canvas.getByRole('textbox', { name: 'Comment' })).toHaveValue(
          originalComment
        )
        await userEvent.click(canvas.getByText('Delivery', { exact: true }))
        if (closeWhileDocked) {
          await userEvent.click(canvas.getByRole('button', { name: 'Close' }))
          await userEvent.click(canvas.getByText('Delivery', { exact: true }))
        }

        await page.viewport(900, 900)
        const nextDialog = await body.findByRole('dialog', {
          name: 'Transaction',
        })
        expect(
          within(nextDialog).getByRole('textbox', { name: 'Comment' })
        ).toHaveValue('Food delivery')
        expect(canvas.getByLabelText('Saved comment')).toBeEmptyDOMElement()
        await userEvent.keyboard('{Escape}')
        await waitFor(() =>
          expect(body.queryByRole('dialog', { name: 'Transaction' })).toBeNull()
        )
        await userEvent.click(
          canvas.getByRole('button', { name: 'Edit transaction' })
        )
        const reopened = await body.findByRole('dialog', {
          name: 'Transaction',
        })
        expect(
          within(reopened).getByRole('textbox', { name: 'Comment' })
        ).toHaveValue(originalComment)
        await userEvent.keyboard('{Escape}')
        await waitFor(() =>
          expect(body.queryByRole('dialog', { name: 'Transaction' })).toBeNull()
        )
      }
    } finally {
      await page.viewport(originalWidth, originalHeight)
    }
  },
}
