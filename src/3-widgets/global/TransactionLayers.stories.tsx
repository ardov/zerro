import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test'
import { useNavigate } from 'react-router-dom'
import {
  transactionScreen,
  useTransactionPreview,
} from './TransactionPreviewDrawer'
import TransactionsView from '@/2-pages/Transactions'
import Budgets from '@/2-pages/Budgets'
import { Layout } from '@/1-app/Layout'
import { pageColumns } from '@/1-app/pageColumns'
import { Button } from '@/6-shared/ui/kit/Button'
import { useTransactionDrawer } from './TransactionListDrawer'
import { useEnvTransactionsDrawer } from './EnvTransactionsDrawer'
import { useAppDispatch, useAppSelector } from '@/store'
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

function Harness({ budget = false }: { budget?: boolean }) {
  const dispatch = useAppDispatch()
  const lunch = useAppSelector(core.transactions.selectAll).lunch
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
      <button
        data-testid="recreate-lunch"
        onClick={() =>
          dispatch(
            core.transactions.recreate({
              ...lunch,
              comment: 'Remote replacement',
            })
          )
        }
      >
        Apply remote recreation
      </button>
      <button
        data-testid="change-lunch-merchant"
        onClick={() =>
          dispatch(core.transactions.update({ id: 'lunch', merchant: 'other' }))
        }
      >
        Apply remote merchant change
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
      <Layout
        navigation
        columns={budget ? pageColumns.budget : pageColumns.transactions}
      >
        {budget ? <Budgets /> : <TransactionsView />}
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
    await waitFor(() => expect(secondList).toBeVisible())
    fireEvent.click(canvas.getByTestId('back'))
    await waitFor(() => expect(secondList).not.toBeInTheDocument())
    await waitFor(() => expect(firstDetails).toBeVisible())
    expect(comment).toHaveValue('Dinner saved in first pair')
    await userEvent.click(within(firstList).getByText('Lunch groceries'))
    await waitFor(() =>
      expect(
        within(firstDetails).getByRole('textbox', { name: 'Comment' })
      ).toHaveValue('Lunch groceries')
    )
    fireEvent.click(canvas.getByTestId('back'))
    await waitFor(() => expect(firstDetails).not.toBeVisible())
    await waitFor(() => expect(firstList).toBeVisible())
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

// These values enter a new MemoryRouter and OverlayHost. No live owner/cache
// from an earlier opening participates in the restoration.
const mixedStack = {
  overlays: {
    screens: {
      transaction: 'other',

      'screen:transactionList:envelope': {
        title: 'Restored envelope',
        initialQuery: {
          clauses: [
            {
              kind: 'activity',
              envelopeIds: ['tag#Food'],
              scope: 'tree',
              mode: 'envelope',
              month: '2026-10',
            },
          ],
        },
      },
      'screen:transactionDetails:lower': {
        ownerListId: 'screen:transactionList:envelope',
        content: { kind: 'transaction', id: 'lunch' },
      },
      'screen:transactionList:merchant': {
        title: 'Restored merchant',
        initialQuery: { clauses: [{ kind: 'merchant', ids: ['lidl'] }] },
      },
      'screen:transactionDetails:upper': {
        ownerListId: 'screen:transactionList:merchant',
        content: { kind: 'transaction', id: 'dinner' },
      },
    },
    ours: false,
  },
}

export const RestoredMixedStack: Story = {
  tags: ['check'],
  parameters: { app: { state: mixedStack } },
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const baseTransaction =
      canvas.getByLabelText('Page transaction').textContent
    const document = canvasElement.ownerDocument
    const body = within(document.body)
    const list = await body.findByRole('dialog', {
      name: 'Restored merchant',
      hidden: true,
    })
    const wide = window.innerWidth >= 776
    const editor = await (wide ? within(list) : body).findByRole(
      wide ? 'region' : 'dialog',
      { name: 'Transaction' }
    )
    await waitFor(() => expect(editor).toBeVisible())
    await waitFor(() =>
      expect(
        (wide ? list : editor).contains(document.activeElement),
        `Initial focus: ${document.activeElement?.getAttribute('aria-label')}`
      ).toBe(true)
    )
    const comment = within(editor).getByRole('textbox', { name: 'Comment' })
    await waitFor(() => {
      const rect = comment.getBoundingClientRect()
      expect(
        document.elementFromPoint(
          rect.x + rect.width / 2,
          rect.y + rect.height / 2
        )
      ).toBe(comment)
    })
    await userEvent.clear(comment)
    await userEvent.type(comment, 'Restored top is interactive')
    await userEvent.tab()
    expect(comment).toHaveValue('Restored top is interactive')
    if (wide) {
      await userEvent.click(within(list).getByText('Lunch groceries'))
      await waitFor(() => expect(comment).toHaveValue('Lunch groceries'))
    }
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(editor).not.toBeVisible())
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(list).not.toBeInTheDocument())
    const lower = await body.findByRole('dialog', {
      name: 'Restored envelope',
      hidden: true,
    })
    const lowerEditor = await (wide ? within(lower) : body).findByRole(
      wide ? 'region' : 'dialog',
      { name: 'Transaction' }
    )
    await waitFor(() => expect(lowerEditor).toBeVisible())
    await waitFor(() =>
      expect(
        (wide ? lower : lowerEditor).contains(document.activeElement),
        `Uncovered focus: ${document.activeElement?.getAttribute('aria-label')}`
      ).toBe(true)
    )
    expect(
      within(lowerEditor).getByRole('textbox', { name: 'Comment' })
    ).toHaveValue('Lunch groceries')
    expect(canvas.getByLabelText('Page transaction')).toHaveTextContent(
      baseTransaction!
    )
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(lowerEditor).not.toBeVisible())
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(lower).not.toBeInTheDocument())
    expect(canvas.getByLabelText('Page transaction')).toHaveTextContent(
      baseTransaction!
    )
  },
}

export const RestoredMixedStackMobile: Story = {
  ...RestoredMixedStack,
  globals: { viewport: { value: 'iphone13' } },
}

export const CoveredTransactionDisappears: Story = {
  tags: ['check'],
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByText('Lunch groceries'))
    const editor = await canvas.findByRole('region', { name: 'Transaction' })
    await userEvent.click(within(editor).getByRole('button', { name: 'More' }))
    await userEvent.click(
      await body.findByRole('menuitem', { name: 'Merchant transactions' })
    )
    const list = await body.findByRole('dialog', { name: 'Lidl' })
    await within(list).findByText('Lunch groceries')
    // External Core recreation purges the original id without asking its
    // navigation owner to follow the replacement.
    fireEvent.click(canvas.getByTestId('recreate-lunch'))
    await waitFor(() =>
      expect(canvas.getByLabelText('Page transaction')).toHaveTextContent(
        'none'
      )
    )
    expect(list).toBeVisible()
    expect(within(list).queryByText('Lunch groceries')).toBeNull()
    await userEvent.click(await within(list).findByText('Remote replacement'))
    const childEditor = await within(list).findByRole('region', {
      name: 'Transaction',
    })
    expect(
      within(childEditor).getByRole('textbox', { name: 'Comment' })
    ).toHaveValue('Remote replacement')
    fireEvent.click(canvas.getByTestId('back'))
    await waitFor(() => expect(childEditor).not.toBeVisible())
    expect(list).toBeVisible()
    fireEvent.click(canvas.getByTestId('back'))
    await waitFor(() => expect(list).not.toBeInTheDocument())
    expect(canvas.getByLabelText('Page transaction')).toHaveTextContent('none')
    expect(body.queryByRole('dialog', { name: 'Transaction' })).toBeNull()
  },
}

export const RestoredEnvelopeEntry: Story = {
  tags: ['check'],
  parameters: {
    app: {
      state: {
        overlays: {
          screens: {
            envelopeTransactions: {
              title: 'Saved envelope',
              envelopeConditions: { id: 'tag#Food', month: '2026-10' },
            },
          },
          ours: false,
        },
      },
    },
  },
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    const list = await body.findByRole('dialog', { name: 'Saved envelope' })
    await within(list).findByText('Lunch groceries')
    const checkbox = within(list).getAllByRole('checkbox')[0]
    await userEvent.click(checkbox)
    await waitFor(() =>
      expect(checkbox).toHaveAttribute('aria-checked', 'true')
    )
    expect(within(list).getByRole('button', { name: 'Food' })).toBeVisible()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(list).not.toBeInTheDocument())
  },
}

export const RestoredBudgetStackMobile: Story = {
  ...RestoredMixedStackMobile,
  parameters: {
    app: {
      route: '/budget',
      state: {
        overlays: {
          ...mixedStack.overlays,
          screens: {
            envelope: 'tag#Food',
            ...Object.fromEntries(
              Object.entries(mixedStack.overlays.screens).filter(
                ([key]) => key !== 'transaction'
              )
            ),
          },
        },
      },
    },
  },
  render: () => <Harness budget />,
  play: async context => {
    await RestoredMixedStack.play!(context)
    const body = within(context.canvasElement.ownerDocument.body)
    const envelope = await body.findByRole('dialog', { name: 'Category' })
    await waitFor(() => expect(envelope).toBeVisible())
    await waitFor(() =>
      expect(envelope.contains(document.activeElement)).toBe(true)
    )
  },
}

export const RestoredMissingTransaction: Story = {
  tags: ['check'],
  parameters: {
    app: {
      state: {
        overlays: {
          ...mixedStack.overlays,
          screens: {
            ...mixedStack.overlays.screens,
            transaction: 'unavailable',
          },
        },
      },
    },
  },
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await waitFor(() =>
      expect(canvas.getByLabelText('Page transaction')).toHaveTextContent(
        'none'
      )
    )
    const list = await body.findByRole('dialog', { name: 'Restored merchant' })
    const editor = await within(list).findByRole('region', {
      name: 'Transaction',
    })
    expect(
      within(editor).getByRole('textbox', { name: 'Comment' })
    ).toHaveValue('Dinner groceries')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(editor).not.toBeVisible())
    expect(list).toBeVisible()
  },
}

export const ExplicitListCloseRestoresOpener: Story = {
  tags: ['check'],
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByText('Lunch groceries'))
    const editor = await canvas.findByRole('region', { name: 'Transaction' })
    const opener = within(editor).getByRole('button', { name: 'More' })
    await userEvent.click(opener)
    await userEvent.click(
      await body.findByRole('menuitem', { name: 'Merchant transactions' })
    )
    const list = await body.findByRole('dialog', { name: 'Lidl' })
    await userEvent.click(
      within(within(list).getByRole('region', { name: 'Lidl' })).getByRole(
        'button',
        { name: 'Close' }
      )
    )
    await waitFor(() => expect(list).not.toBeInTheDocument())
    await waitFor(() => expect(opener).toHaveFocus())
  },
}

export const MissingDetailsOpenerRestoresListFocus: Story = {
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
    const row = await within(list).findByText('Lunch groceries')
    const checkbox = within(list).getAllByRole('checkbox').at(-1)!
    await userEvent.click(checkbox)
    expect(checkbox).toHaveFocus()
    await userEvent.click(row)
    const editor = await within(list).findByRole('region', {
      name: 'Transaction',
    })
    fireEvent.click(canvas.getByTestId('change-lunch-merchant'))
    await waitFor(() => expect(row).not.toBeInTheDocument())
    expect(checkbox).not.toBeInTheDocument()
    const comment = within(editor).getByRole('textbox', { name: 'Comment' })
    await userEvent.click(comment)
    expect(comment).toHaveValue('Lunch groceries')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(editor).not.toBeVisible())
    await waitFor(() =>
      expect(
        within(list)
          .getByRole('region', { name: 'Filtered transactions' })
          .contains(document.activeElement)
      ).toBe(true)
    )
  },
}
