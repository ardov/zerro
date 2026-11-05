import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { useAsk } from '@/6-shared/overlays'
import { useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'
import { Button } from '@/6-shared/ui/kit/Button'
import { AccountMenu } from './AccountContextMenu'
import { TransactionMenu } from './TrContextMenu'

function Demo() {
  const ask = useAsk()
  const accounts = core.accounts.useAll()
  const transactions = useAppSelector(core.transactions.selectAll)
  const [accountId] = useState(() => Object.keys(accounts)[0])
  const [transactionId] = useState(() => Object.keys(transactions)[0])
  const [choice, setChoice] = useState('none')
  return (
    <>
      <Button
        onClick={event =>
          ask(<AccountMenu id={accountId} anchor={event.currentTarget} />)
        }
      >
        Account actions
      </Button>
      <output aria-label="In balance">
        {String(accounts[accountId].inBalance)}
      </output>
      <Button
        onClick={event =>
          ask(
            <TransactionMenu
              id={transactionId}
              anchor={event.currentTarget}
              onSelectSimilar={() => setChoice('selectSimilar')}
              onMarkOlderViewed={() => setChoice('markOlderViewed')}
            />
          )
        }
      >
        Transaction actions
      </Button>
      <output aria-label="Choice">{choice}</output>
    </>
  )
}
const meta = {
  title: 'App/ContextMenus',
  parameters: {
    layout: 'centered',
    app: { scenario: 'demo', globalWidgets: true, route: '/accounts' },
  },
  render: () => <Demo />,
} satisfies Meta
export default meta
type Story = StoryObj<typeof meta>
const check: Story['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const body = within(canvasElement.ownerDocument.body)
  const action = (name: string) =>
    waitFor(() => {
      const item =
        body.queryByRole('menuitem', { name }) ??
        body.queryByRole('button', { name })
      expect(item).not.toBeNull()
      return item!
    })
  const balance = canvas.getByLabelText('In balance')
  const wasIncluded = balance.textContent === 'true'
  const account = canvas.getByRole('button', { name: 'Account actions' })
  await userEvent.click(account)
  await userEvent.click(
    await action(wasIncluded ? 'Exclude from balance' : 'Include in balance')
  )
  await waitFor(() => expect(balance).toHaveTextContent(String(!wasIncluded)))
  await waitFor(() => expect(account).toHaveFocus())
  const transaction = canvas.getByRole('button', {
    name: 'Transaction actions',
  })
  await userEvent.click(transaction)
  await userEvent.click(await action('Select others from this sync'))
  await waitFor(() =>
    expect(canvas.getByLabelText('Choice')).toHaveTextContent('selectSimilar')
  )
  await waitFor(() => expect(transaction).toHaveFocus())
}
export const Desktop: Story = {
  globals: { viewport: { value: 'zerro500' } },
  play: check,
}
export const Mobile: Story = {
  globals: { viewport: { value: 'zerro499' } },
  play: check,
}
