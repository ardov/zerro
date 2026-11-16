import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState, type ComponentProps } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { Button } from '@/6-shared/ui/kit/Button'
import { usePopup } from '@/6-shared/overlays'
import { ZerroDataAccountDialog } from './ZerroDataAccountNotice'
import { makeAccount } from '@/zerro-core/support/testing/zenmoneyTestData'

const accounts = [
  makeAccount({ id: 'card', title: 'Revolut', type: 'ccard' }),
  makeAccount({ id: 'cash', title: 'Cash', type: 'cash' }),
]

function Example({
  accounts,
}: Pick<ComponentProps<typeof ZerroDataAccountDialog>, 'accounts'>) {
  const [open, setOpen] = useState(true)
  return (
    <ZerroDataAccountDialog
      controller={{ open, setOpen }}
      accounts={accounts}
    />
  )
}

const meta = {
  title: 'App/Accounts/DataAccountNotice',
  component: Example,
  args: { accounts },
} satisfies Meta<typeof Example>

export default meta
type Story = StoryObj<typeof meta>

export const Bench: Story = {}

export const English: Story = {
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    const dialog = await body.findByRole('dialog', {
      name: 'Zerro created a service account',
    })
    await waitFor(() =>
      expect(within(dialog).getByText('[Zerro Data]')).toBeVisible()
    )
    const preview = within(dialog).getByRole('img', { name: /Zerro Data/ })
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const row = within(preview).getByText('[Zerro Data]').parentElement!
      await expect(getComputedStyle(row).transform).toBe('none')
    }
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Got it' })
    )
    await waitFor(() => expect(dialog).not.toBeVisible())
  },
}

export const Russian: Story = {
  globals: { locale: 'ru' },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    const dialog = await body.findByRole('dialog', {
      name: 'Zerro создал служебный счёт',
    })
    await waitFor(() =>
      expect(
        within(dialog).getByText(/Не удаляйте и не переименовывайте/)
      ).toBeVisible()
    )
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Понятно' })
    )
    await waitFor(() => expect(dialog).not.toBeVisible())
  },
}

export const Mobile: Story = {
  args: { accounts: [accounts[0], { ...accounts[1], title: 'Наличные' }] },
  globals: { viewport: { value: 'iphone13' }, locale: 'ru' },
  play: Russian.play,
}

export const NoAccounts: Story = {
  args: { accounts: [] },
  play: English.play,
}

export const LongAccountNames: Story = {
  args: {
    accounts: accounts.map(account => ({
      ...account,
      title: 'Very long account name with additional details and currency',
    })),
  },
  globals: { viewport: { value: 'iphone13' } },
  play: English.play,
}

function HistoryExample() {
  const popup = usePopup()
  return (
    <>
      <Button onClick={() => popup.setOpen(true)}>Show notice</Button>
      <ZerroDataAccountDialog controller={popup} />
    </>
  )
}

export const BackAndEscape: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { historyShortcuts: true },
  render: () => <HistoryExample />,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(body.getByRole('button', { name: 'Show notice' }))
    let dialog = await body.findByRole('dialog')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(dialog).not.toBeVisible())
    await userEvent.click(body.getByRole('button', { name: 'Show notice' }))
    dialog = await body.findByRole('dialog')
    await userEvent.keyboard('{Alt>}{ArrowLeft}{/Alt}')
    await waitFor(() => expect(dialog).not.toBeVisible())
    await expect(
      body.getByRole('button', { name: 'Show notice' })
    ).toHaveFocus()
  },
}
