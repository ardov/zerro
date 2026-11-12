import { usePopup } from '@/6-shared/overlays'
import { useState, type ReactNode } from 'react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { rootReducer } from '@/store/rootReducer'
import { makeTestRootState } from '@/store/testing'
import { useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'
import {
  makeStore,
  makeAccount,
  makeInstrument,
  makeUser,
  makeTag,
  makeTransaction,
} from '@/zerro-core/support/testing/zenmoneyTestData'
import { BulkEditModal } from '../transaction/TransactionList/TopBar/BulkEditModal'
import { CategoryRow } from './CategoryRow'
import { applyCategoryAction, commonCategories } from './model'

const meta = {
  title: 'App/Transactions/Categories',
  parameters: {
    app: { scenario: 'demo' },
    layout: 'centered',
    docs: {
      description: {
        component:
          'CategoryRow edits an ordered prefix through onAction. mixed represents the differing suffix of a bulk draft and hides Add. align="center" centers the chips while reserving symmetric space for Add. CategorySelect chooses one id; the owner applies the action and keeps the first occurrence of duplicate ids.',
      },
    },
  },
} satisfies Meta
export default meta
type Story = StoryObj

const ids = ['first', 'second']
function Fixtures(props: {
  children: ReactNode
  debt?: 'only' | 'mixed'
  mixedPlaces?: boolean
  transfer?: boolean
}) {
  const { children, debt, mixedPlaces, transfer } = props
  const [store] = useState(() =>
    configureStore({
      reducer: rootReducer,
      preloadedState: makeTestRootState(
        makeStore({
          user: { 1: makeUser({ id: 1, parent: null, currency: 1 }) },
          account: debt
            ? {
                cash: makeAccount({ id: 'cash' }),
                debt: makeAccount({ id: 'debt', type: 'debt' }),
              }
            : {},
          instrument: { 1: makeInstrument({ id: 1, shortTitle: 'USD' }) },
          tag: Object.fromEntries(
            [
              makeTag({
                id: 'food',
                title: '🥕 Food',
                showOutcome: true,
                color: 0xe7c85b,
              }),
              makeTag({
                id: 'cafe',
                title: '☕ Cafe',
                parent: 'food',
                showOutcome: true,
              }),
              makeTag({
                id: 'long',
                title:
                  'A very long category name that should fit inside the narrow editor',
                showOutcome: true,
              }),
              makeTag({ id: 'trip', title: 'Trip', showOutcome: true }),
              makeTag({ id: 'work', title: 'Work', showOutcome: true }),
              makeTag({ id: 'income', title: 'Income', showIncome: true }),
              makeTag({
                id: 'gift',
                title: 'Gift',
                parent: 'income',
                showIncome: true,
              }),
              makeTag({
                id: 'salary',
                title: 'Salary',
                parent: 'income',
                showIncome: true,
              }),
            ].map(tag => [tag.id, tag])
          ),
          transaction: {
            first: makeTransaction({
              id: 'first',
              comment: 'Lunch',
              ...(mixedPlaces && { payee: 'Cafe' }),
              ...(debt && {
                incomeAccount: 'debt',
                outcomeAccount: 'cash',
                income: 10,
                payee: 'Alex',
              }),
              tag: ['food', 'trip'],
              income: debt || transfer ? 10 : 0,
              outcome: 10,
            }),
            second: makeTransaction({
              id: 'second',
              comment: 'Dinner',
              ...(mixedPlaces && { payee: 'Shop' }),
              ...(debt && {
                incomeAccount: 'cash',
                outcomeAccount: debt === 'only' ? 'debt' : 'cash',
                payee: debt === 'only' ? 'Alex' : 'Shop',
              }),
              tag: ['food', 'work'],
              income: debt === 'only' ? 20 : 0,
              outcome: 20,
            }),
          },
        })
      ),
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
          immutableCheck: false,
          serializableCheck: false,
        }),
    })
  )
  return <Provider store={store}>{children}</Provider>
}

function RowDemo(props: { initial?: string[][]; align?: 'start' | 'center' }) {
  const { initial = [['food', 'cafe']], align = 'center' } = props
  const [values, setValues] = useState(initial)
  return (
    <div className="w-[300px] max-w-full space-y-4">
      <CategoryRow
        {...commonCategories(values)}
        align={align}
        preferredType="outcome"
        onAction={action =>
          setValues(current =>
            current.map(value => applyCategoryAction(value, action))
          )
        }
      />
      <output className="sr-only" aria-label="Category drafts">
        {JSON.stringify(values)}
      </output>
    </div>
  )
}

export const Showcase: Story = {
  render: () => (
    <Fixtures>
      <div className="flex flex-col gap-8">
        <RowDemo initial={[['food']]} />
        <RowDemo initial={[['long', 'food']]} />
        <RowDemo initial={[['food', 'cafe', 'trip', 'work', 'gift']]} />
        <RowDemo
          initial={[
            ['food', 'trip'],
            ['food', 'work'],
          ]}
          align="start"
        />
        <RowDemo initial={[[]]} />
      </div>
    </Fixtures>
  ),
}

export const Editing: Story = {
  render: () => (
    <Fixtures>
      <RowDemo />
    </Fixtures>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('combobox', { name: 'Cafe' }))
    // An excluded parent remains selectable, and selecting it deduplicates.
    const parent = await body.findByRole('option', { name: 'Food' })
    await expect(parent).not.toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(parent)
    await waitFor(() =>
      expect(canvas.getByLabelText('Category drafts')).toHaveTextContent(
        '[["food"]]'
      )
    )
    await userEvent.click(
      canvas.getByRole('combobox', { name: 'Add category' })
    )
    const search = await body.findByRole('combobox', {
      name: 'Select category',
    })
    await userEvent.type(search, 'пшае')
    await expect(search).toHaveValue('пшае')
    await expect(body.getByRole('option', { name: 'Income' })).toBeVisible()
    await userEvent.click(body.getByRole('option', { name: 'Gift' }))
    await waitFor(() =>
      expect(canvas.getByLabelText('Category drafts')).toHaveTextContent(
        '[["food","gift"]]'
      )
    )
    const gift = canvas.getByRole('combobox', { name: 'Gift' })
    await userEvent.click(gift)
    await expect(
      await body.findByRole('option', { name: 'Gift' })
    ).toHaveAttribute('aria-selected', 'true')
    await expect(body.getByRole('option', { name: 'Income' })).toBeVisible()
    await expect(body.queryByRole('option', { name: 'Salary' })).toBeNull()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(gift).toHaveFocus())
    await userEvent.keyboard('{Delete}')
    await expect(canvas.getByLabelText('Category drafts')).toHaveTextContent(
      '[["food"]]'
    )
    await expect(canvas.getByRole('combobox', { name: 'Food' })).toHaveFocus()
    await userEvent.keyboard('{Delete}')
    await expect(canvas.getByLabelText('Category drafts')).toHaveTextContent(
      '[[]]'
    )
    await expect(
      canvas.getByRole('combobox', { name: 'Add category' })
    ).toHaveFocus()
  },
}

export const Mixed: Story = {
  render: () => (
    <Fixtures>
      <RowDemo
        initial={[
          ['food', 'trip'],
          ['food', 'work'],
        ]}
        align="start"
      />
    </Fixtures>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body)
    await expect(
      canvas.queryByRole('combobox', { name: 'Add category' })
    ).toBeNull()
    await userEvent.click(canvas.getByRole('combobox', { name: 'Food' }))
    await userEvent.click(await body.findByRole('option', { name: 'Cafe' }))
    await waitFor(() =>
      expect(canvas.getByLabelText('Category drafts')).toHaveTextContent(
        '[["cafe","trip"],["cafe","work"]]'
      )
    )
    await userEvent.click(
      canvas.getByRole('combobox', { name: 'Mixed categories' })
    )
    await userEvent.click(await body.findByRole('option', { name: 'Trip' }))
    await waitFor(() =>
      expect(canvas.getByLabelText('Category drafts')).toHaveTextContent(
        '[["cafe","trip"],["cafe","trip"]]'
      )
    )
    await expect(
      canvas.getByRole('combobox', { name: 'Add category' })
    ).toBeVisible()
  },
}

export const Expansion: Story = {
  render: () => (
    <Fixtures>
      <RowDemo initial={[[]]} />
    </Fixtures>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body)
    const add = canvas.getByRole('combobox', { name: 'Add category' })
    await userEvent.click(add)
    await userEvent.click(
      await body.findByRole('button', { name: 'Show all categories' })
    )
    await expect(
      body.getByRole('combobox', { name: 'Select category' })
    ).toHaveFocus()
    await expect(body.getByRole('option', { name: 'Salary' })).toBeVisible()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(add).toHaveFocus())
    await userEvent.click(add)
    await expect(
      await body.findByRole('button', { name: 'Show all categories' })
    ).toBeVisible()
    await expect(body.queryByRole('option', { name: 'Salary' })).toBeNull()
    await userEvent.keyboard('{Escape}')
  },
}

function BulkDemo() {
  const popup = usePopup()
  const { setOpen } = popup
  const transactions = useAppSelector(core.transactions.selectAll)
  const debtors = useAppSelector(core.debtors.selectAll)
  return (
    <>
      <button onClick={() => setOpen(true)}>Edit selection</button>
      <BulkEditModal
        ids={ids}
        controller={popup}
        onApply={() => setOpen(false)}
      />
      <output aria-label="Debt balances">
        {JSON.stringify(Object.values(debtors).map(debtor => debtor.balance))}
      </output>
      <output aria-label="Saved places">
        {JSON.stringify(ids.map(id => transactions[id].payee))}
      </output>
      <output aria-label="Saved comments">
        {JSON.stringify(ids.map(id => transactions[id].comment))}
      </output>
      <output aria-label="Saved categories">
        {JSON.stringify(ids.map(id => transactions[id].tag))}
      </output>
    </>
  )
}
export const BulkSaveAndCancel: Story = {
  render: () => (
    <Fixtures>
      <BulkDemo />
    </Fixtures>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body)
    for (const save of [false, true]) {
      await userEvent.click(
        canvas.getByRole('button', { name: 'Edit selection' })
      )
      await userEvent.click(await body.findByRole('combobox', { name: 'Food' }))
      await userEvent.click(await body.findByRole('option', { name: 'Cafe' }))
      await waitFor(() => expect(body.queryByRole('listbox')).toBeNull())
      await expect(canvas.getByLabelText('Saved categories')).toHaveTextContent(
        '[["food","trip"],["food","work"]]'
      )
      await userEvent.click(body.getByRole('combobox', { name: 'Place' }))
      await userEvent.type(
        await body.findByRole('combobox', { name: 'Find or create' }),
        'Bulk test shop'
      )
      await userEvent.click(
        await body.findByRole('option', { name: /Create.*Bulk test shop/ })
      )
      await waitFor(() => expect(body.queryByRole('listbox')).toBeNull())
      await userEvent.click(
        body.getByRole('button', {
          name: save ? 'Apply Changes' : 'Cancel',
        })
      )
      await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
      if (!save)
        expect(canvas.getByLabelText('Saved places')).not.toHaveTextContent(
          'Bulk test shop'
        )
      expect(canvas.getByLabelText('Saved comments')).toHaveTextContent(
        '["Lunch","Dinner"]'
      )
    }
    await expect(canvas.getByLabelText('Saved places')).toHaveTextContent(
      '["Bulk test shop","Bulk test shop"]'
    )
    await userEvent.click(
      canvas.getByRole('button', { name: 'Edit selection' })
    )
    await userEvent.click(
      await body.findByRole('button', { name: 'Leave empty' })
    )
    await userEvent.click(body.getByRole('button', { name: 'Apply Changes' }))
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
    await expect(canvas.getByLabelText('Saved places')).toHaveTextContent(
      '[null,null]'
    )

    await expect(canvas.getByLabelText('Saved categories')).toHaveTextContent(
      '[["cafe","trip"],["cafe","work"]]'
    )
  },
}

export const MobileBulkSaveAndCancel: Story = {
  ...BulkSaveAndCancel,
  globals: { viewport: { value: 'mobile1' } },
}

export const BulkDebtKeepsCounterparty: Story = {
  render: () => (
    <Fixtures debt="only">
      <BulkDemo />
    </Fixtures>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const originalPlaces = canvas.getByLabelText('Saved places').textContent
    const originalBalances = canvas.getByLabelText('Debt balances').textContent
    expect(originalBalances).not.toBe('[]')
    await userEvent.click(
      canvas.getByRole('button', { name: 'Edit selection' })
    )
    await body.findByRole('dialog')
    expect(body.getByRole('combobox', { name: /^Place/ })).toHaveTextContent(
      originalPlaces?.includes('Shop') ? 'Different places' : 'Alex'
    )
    expect(body.queryByRole('button', { name: 'Leave empty' })).toBeNull()
    await userEvent.type(
      body.getByRole('textbox', { name: 'Comment' }),
      'Updated'
    )
    await userEvent.click(body.getByRole('button', { name: 'Apply Changes' }))
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
    expect(canvas.getByLabelText('Saved places').textContent).toBe(
      originalPlaces
    )
    expect(canvas.getByLabelText('Debt balances').textContent).toBe(
      originalBalances
    )
    expect(canvas.getByLabelText('Saved comments')).toHaveTextContent(
      '["Updated","Updated"]'
    )
  },
}

export const BulkMixedDebtKeepsCounterparty: Story = {
  ...BulkDebtKeepsCounterparty,
  render: () => (
    <Fixtures debt="mixed">
      <BulkDemo />
    </Fixtures>
  ),
}

export const BulkMixedPlaces: Story = {
  render: () => (
    <Fixtures mixedPlaces>
      <BulkDemo />
    </Fixtures>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      canvas.getByRole('button', { name: 'Edit selection' })
    )
    const field = await body.findByRole('combobox', { name: /^Place/ })
    expect(field).toHaveTextContent('Different places')
    await userEvent.click(body.getByRole('button', { name: 'Leave empty' }))
    expect(field).not.toHaveTextContent('Different places')
    await userEvent.click(body.getByRole('button', { name: 'Apply Changes' }))
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
    await waitFor(() =>
      expect(canvas.getByLabelText('Saved places')).toHaveTextContent(
        '[null,null]'
      )
    )
  },
}

export const BulkWithTransfer: Story = {
  render: () => (
    <Fixtures transfer>
      <BulkDemo />
    </Fixtures>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      canvas.getByRole('button', { name: 'Edit selection' })
    )
    await body.findByRole('dialog')
    expect(body.queryByRole('combobox', { name: /^Place/ })).toBeNull()
    await userEvent.click(body.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
  },
}

function FormDemo() {
  const [value, setValue] = useState(['food'])
  const [saved, setSaved] = useState(false)
  return (
    <form
      onSubmit={event => {
        event.preventDefault()
        setSaved(true)
      }}
    >
      <CategoryRow
        value={value}
        onAction={action =>
          setValue(current => applyCategoryAction(current, action))
        }
      />
      <button type="submit">Save form</button>
      {saved && <p>Form saved</p>}
    </form>
  )
}

export const InsideForm: Story = {
  render: () => (
    <Fixtures>
      <FormDemo />
    </Fixtures>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Save form' }))
    await expect(await canvas.findByText('Form saved')).toBeVisible()
  },
}
