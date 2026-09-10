import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'
import { TransactionCreateButton } from './TransactionCreateButton'

const meta = {
  title: 'App/Transactions/Create',
  component: TransactionCreateButton,
  parameters: { app: { scenario: 'demo', route: '/budget' } },
} satisfies Meta<typeof TransactionCreateButton>
export default meta
type Story = StoryObj<typeof meta>

export const Bench: Story = {}

function CreationCheck() {
  const transactions = useAppSelector(core.transactions.selectAll)
  return (
    <>
      <TransactionCreateButton />
      <output data-testid="created-count">
        {
          Object.values(transactions).filter(
            tr => tr.comment === 'Creation check'
          ).length
        }
      </output>
    </>
  )
}

export const SaveAndReopen: Story = {
  tags: ['check'],
  render: () => <CreationCheck />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole('button', {
      name: /New transaction|Новая операция/,
    })
    await userEvent.click(trigger)
    const dialog = within(
      await body.findByRole('dialog', {
        name: /New transaction|Новая операция/,
      })
    )
    const amount = dialog.getByRole('textbox', { name: /^(Amount|Сумма)$/ })
    await userEvent.click(
      dialog.getByRole('button', {
        name: /Create transaction|Создать операцию/,
      })
    )
    await expect(canvas.getByTestId('created-count')).toHaveTextContent('0')
    await expect(amount).toHaveAttribute('aria-invalid', 'true')
    await userEvent.clear(amount)
    await userEvent.type(amount, '123')
    await expect(amount).not.toHaveAttribute('aria-invalid')
    await userEvent.type(
      dialog.getByRole('textbox', { name: /^(Comment|Комментарий)$/ }),
      'Creation check'
    )
    await userEvent.click(
      dialog.getByRole('button', {
        name: /Create transaction|Создать операцию/,
      })
    )
    await waitFor(() =>
      expect(body.queryByRole('dialog')).not.toBeInTheDocument()
    )
    await expect(canvas.getByTestId('created-count')).toHaveTextContent('1')
    await expect(trigger).toHaveFocus()
    await userEvent.click(trigger)
    const fresh = within(await body.findByRole('dialog'))
    await expect(
      fresh.getByRole('textbox', { name: /^(Comment|Комментарий)$/ })
    ).toHaveValue('')
    const comment = fresh.getByRole('textbox', {
      name: /^(Comment|Комментарий)$/,
    })
    await userEvent.type(comment, 'Session draft')
    await userEvent.keyboard('{Escape}')
    await waitFor(() =>
      expect(body.queryByRole('dialog')).not.toBeInTheDocument()
    )
    await userEvent.click(trigger)
    const restored = within(await body.findByRole('dialog'))
    const restoredComment = restored.getByRole('textbox', {
      name: /^(Comment|Комментарий)$/,
    })
    await expect(restoredComment).toHaveValue('Session draft')
    await userEvent.keyboard('{Escape}')
    await waitFor(() =>
      expect(body.queryByRole('dialog')).not.toBeInTheDocument()
    )
    await expect(canvas.getByTestId('created-count')).toHaveTextContent('1')
  },
}

export const WithoutAccounts: Story = {
  tags: ['check'],
  parameters: { app: { scenario: 'empty', route: '/budget' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      canvas.getByRole('button', {
        name: /New transaction|Новая операция/,
      })
    )
    const dialog = within(
      await body.findByRole('dialog', {
        name: /New transaction|Новая операция/,
      })
    )
    const account = dialog.getByRole('button', {
      name: /^(Account|Счёт)$/,
    })

    await userEvent.click(
      dialog.getByRole('button', {
        name: /Create transaction|Создать операцию/,
      })
    )

    await expect(account).toHaveAttribute('aria-invalid', 'true')
  },
}
