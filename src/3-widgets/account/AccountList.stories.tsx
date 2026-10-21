import type { Meta, StoryObj } from '@storybook/react-vite'
import AccountList from './AccountList'
import Accounts from '@/2-pages/Accounts'
import { DebtorList } from '@/3-widgets/DebtorList'
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test'
import { Account } from './AccountList/components'
import { makeAccount } from '@/zerro-core/support/testing/zenmoneyTestData'

const meta = {
  title: 'App/Accounts',
  component: AccountList,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    app: { scenario: 'demo', globalWidgets: true, route: '/accounts' },
  },
} satisfies Meta<typeof AccountList>

export default meta
type Story = StoryObj

export const BankMarks: Story = {
  render: () => (
    <div className="w-80">
      {[
        { id: 'known', title: 'Bank account', company: 12574 },
        { id: 'missing', title: 'Unknown bank', company: -1 },
        { id: 'cash', title: 'Cash', company: null },
        {
          id: 'archived',
          title: 'Archived account with a very long name that should fade',
          company: null,
          archive: true,
          balance: -1234.56,
        },
      ].map(account => (
        <Account
          key={account.id}
          account={{
            ...makeAccount({ ...account, type: 'checking' }),
            fxCode: 'USD',
            inBudget: true,
            startBalanceReal: 0,
          }}
        />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const bank = canvas.getByRole('button', { name: /Bank account/ })
    const image = bank.querySelector('img')!
    await waitFor(() => expect(image.naturalWidth).toBeGreaterThan(0))
    expect(image.getBoundingClientRect().width).toBe(20)
    expect(image.getBoundingClientRect().height).toBe(20)
    const archived = canvas.getByRole('button', { name: /Archived account/ })
    expect(archived.scrollWidth).toBeLessThanOrEqual(archived.clientWidth)
    const label = within(archived).getByTitle(
      'Archived account with a very long name that should fade'
    )
    await waitFor(() => expect(label).toHaveAttribute('data-overflow'))
    expect(getComputedStyle(label).textDecorationLine).toBe('line-through')
    expect(archived.getBoundingClientRect().height).toBe(40)
    for (const name of [/Unknown bank/, /Cash/]) {
      const row = canvas.getByRole('button', { name })
      expect(row.querySelector('img')).toBeNull()
      expect(row.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
      expect(row.getBoundingClientRect().height).toBe(
        bank.getBoundingClientRect().height
      )
    }
  },
}

export const AccountListWithDebtors: Story = {
  render: () => (
    <div className="w-[320px] p-4">
      <AccountList />
      <DebtorList />
    </div>
  ),
}

export const NarrowViewport: Story = {
  globals: { viewport: { value: 'iphone13' } },
  render: () => (
    <div className="w-full max-w-[320px] p-2">
      <AccountList />
    </div>
  ),
}

export const DebtorTransactions: Story = {
  parameters: { app: { scenario: 'debtor-navigation' } },
  render: () => (
    <div className="w-80">
      <DebtorList />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const dollars = canvas.getByRole('button', { name: /Alex.*\$/ })
    dollars.focus()
    await userEvent.keyboard('{Enter}')
    const dialog = await body.findByRole('dialog', { name: 'Alex · USD' })
    await within(dialog).findByText('Alex dollar loan')
    await within(dialog).findByText('Alex dollar repayment')
    expect(within(dialog).queryByText('Alex euro loan')).toBeNull()
    expect(within(dialog).queryByText('Bob loan')).toBeNull()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(dialog).not.toBeInTheDocument())
    await waitFor(() => expect(dollars).toHaveFocus())
    await userEvent.click(canvas.getByRole('button', { name: /Alex.*€/ }))
    const euros = await body.findByRole('dialog', { name: 'Alex · EUR' })
    await within(euros).findByText('Alex euro loan')
    expect(within(euros).queryByText('Alex dollar loan')).toBeNull()
    expect(within(euros).queryByText('Alex dollar repayment')).toBeNull()
  },
}

export const DebtorTransactionsMobile: Story = {
  ...DebtorTransactions,
  globals: { viewport: { value: 'iphone13' } },
}

export const AccountInteractions: Story = {
  render: () => (
    <div className="w-80">
      <AccountList />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const row = canvas.getByRole('button', { name: /Cash USD/ })
    row.focus()
    await userEvent.keyboard('{Enter}')
    const dialog = await body.findByRole('dialog', { name: 'Cash USD' })
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(dialog).not.toBeInTheDocument())
    await waitFor(() => expect(row).toHaveFocus())
    fireEvent.contextMenu(row, { clientX: 150, clientY: 100 })
    const menu = await body.findByRole('menu')
    expect(within(menu).getAllByRole('menuitem')).toHaveLength(1)
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(menu).not.toBeInTheDocument())
  },
}

export const AccountsPage: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div data-testid="accounts-page">
      <Accounts />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const host = canvas.getByTestId('accounts-page')
    const content = host.firstElementChild!
    expect(content.getBoundingClientRect().width).toBe(
      Math.min(500, host.clientWidth)
    )
    expect(host.scrollWidth).toBeLessThanOrEqual(host.clientWidth)
    for (const row of within(content as HTMLElement).getAllByRole('button')) {
      expect(row.getBoundingClientRect().height).toBeGreaterThanOrEqual(48)
      expect(row.scrollWidth).toBeLessThanOrEqual(row.clientWidth)
    }
    expect(
      canvas.getByRole('button', { name: /Cash USD/ }).getBoundingClientRect()
        .height
    ).toBe(48)
  },
}

export const AccountsPageMobile: Story = {
  ...AccountsPage,
  globals: { viewport: { value: 'iphone13' } },
}
