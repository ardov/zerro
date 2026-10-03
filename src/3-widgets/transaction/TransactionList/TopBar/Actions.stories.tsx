import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { core } from '@/zerro-core/redux'
import { useAppSelector } from '@/store'
import { Button } from '@/6-shared/ui/kit/Button'
import Actions from './Actions'

const meta = {
  title: 'App/Transactions/BulkActions',
  component: Actions,
  parameters: {
    layout: 'centered',
    app: { scenario: 'demo', route: '/transactions' },
    historyShortcuts: true,
  },
} satisfies Meta<typeof Actions>
export default meta
type Story = StoryObj

function Harness() {
  const transactions = useAppSelector(core.transactions.selectAll)
  const candidates = Object.values(transactions)
    .filter(tr => !tr.deleted && core.transactions.getType(tr) === 'outcome')
    .slice(0, 3)
  const [ids, setIds] = useState(() => candidates.slice(0, 2).map(tr => tr.id))
  return (
    <div className="relative min-h-80 w-140 max-w-[95vw] rounded-ui-card rounded-smooth bg-ui-base p-4 text-ui-primary">
      <div className="flex flex-col gap-3">
        {candidates.map(tr => (
          <div key={tr.id} className="rounded-ui-control bg-ui-card p-3">
            <span className="text-ui-14 text-ui-secondary">
              {tr.deleted ? 'Deleted' : 'Expense'}
            </span>
            <p>{tr.comment || 'No comment'}</p>
          </div>
        ))}
        {!ids.length && (
          <Button
            onClick={() => setIds(candidates.slice(0, 2).map(tr => tr.id))}
          >
            Select two transactions
          </Button>
        )}
      </div>
      <Actions
        visible={ids.length > 0}
        checkedIds={ids}
        onUncheckAll={() => setIds([])}
        onCheckAll={() => setIds(candidates.map(tr => tr.id))}
      />
      <output className="sr-only" aria-label="Selected transactions">
        {ids.length}
      </output>
    </div>
  )
}

export const Toolbar: Story = { render: () => <Harness /> }

export const EditDialog: Story = {
  ...Toolbar,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Actions' })
    )
    await userEvent.click(await body.findByText('Edit', { exact: true }))
    await waitFor(() =>
      expect(
        body.getByRole('dialog', { name: 'Edit Transactions' })
      ).toBeVisible()
    )
  },
}

export const DeleteConfirmation: Story = {
  ...Toolbar,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Delete Selected' })
    )
    await waitFor(() =>
      expect(
        body.getByRole('alertdialog', { name: 'Delete 2 transactions?' })
      ).toBeVisible()
    )
    await waitFor(() =>
      expect(body.getByRole('button', { name: 'Keep' })).toHaveFocus()
    )
  },
}

export const SaveAndCancel: Story = {
  ...Toolbar,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body)
    const open = async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Actions' }))
      await userEvent.click(await body.findByText('Edit', { exact: true }))
      return within(
        await body.findByRole('dialog', { name: 'Edit Transactions' })
      )
    }
    let dialog = await open()
    await userEvent.clear(dialog.getByRole('textbox', { name: 'Comment' }))
    await userEvent.type(
      dialog.getByRole('textbox', { name: 'Comment' }),
      'Discard this draft'
    )
    // Click outside, then wait past the surface's exit animation.
    const dialogElement = body.getByRole('dialog', {
      name: 'Edit Transactions',
    })
    const outsideTarget = canvasElement.ownerDocument.elementFromPoint(1, 1)
    expect(outsideTarget).not.toBeNull()
    expect(dialogElement.contains(outsideTarget)).toBe(false)
    await userEvent.click(outsideTarget!)
    await new Promise(resolve => setTimeout(resolve, 350))
    expect(
      body.getByRole('dialog', { name: 'Edit Transactions' })
    ).toBeVisible()
    expect(body.getByRole('textbox', { name: 'Comment' })).toHaveValue(
      'Discard this draft'
    )
    await userEvent.keyboard('{Alt>}{ArrowLeft}{/Alt}')
    await waitFor(() =>
      expect(body.queryByRole('dialog')).not.toBeInTheDocument()
    )
    expect(canvas.queryByText('Discard this draft')).toBeNull()
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'Actions' })).toHaveFocus()
    )
    dialog = await open()
    await userEvent.clear(dialog.getByRole('textbox', { name: 'Comment' }))
    await userEvent.type(
      dialog.getByRole('textbox', { name: 'Comment' }),
      'Shared comment'
    )
    await userEvent.click(dialog.getByRole('button', { name: 'Apply Changes' }))
    await waitFor(() =>
      expect(canvas.getAllByText('Shared comment')).toHaveLength(2)
    )
    expect(canvas.getByLabelText('Selected transactions')).toHaveTextContent(
      '0'
    )
    await userEvent.click(
      canvas.getByRole('button', { name: 'Select two transactions' })
    )
    dialog = await open()
    // Explicitly clearing a shared comment applies to both selected rows.
    await userEvent.clear(dialog.getByRole('textbox', { name: 'Comment' }))
    await userEvent.click(dialog.getByRole('button', { name: 'Apply Changes' }))
    await waitFor(() =>
      expect(canvas.getAllByText('No comment')).toHaveLength(2)
    )
    expect(canvas.queryByText('Shared comment')).toBeNull()
  },
}

export const MobileEditDialog: Story = {
  ...EditDialog,
  globals: { viewport: { value: 'zerro499' } },
}

export const MobileSaveAndCancel: Story = {
  ...SaveAndCancel,
  globals: { viewport: { value: 'zerro499' } },
}

export const KeepTransactions: Story = {
  ...Toolbar,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole('button', { name: 'Delete Selected' })
    await userEvent.click(trigger)
    await userEvent.click(await body.findByRole('button', { name: 'Keep' }))
    await waitFor(() =>
      expect(body.queryByRole('alertdialog')).not.toBeInTheDocument()
    )
    await waitFor(() => expect(trigger).toHaveFocus())
    expect(canvas.getByLabelText('Selected transactions')).toHaveTextContent(
      '2'
    )
  },
}
