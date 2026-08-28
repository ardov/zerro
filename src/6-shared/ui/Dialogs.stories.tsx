import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '@mui/material'
import { useConfirm } from './SmartConfirm'
import { useSnackbar } from './SnackbarProvider'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { core } from 'zerro-core/redux'
import { useAppSelector } from 'store'
import { MonthProvider, useMonth } from '2-pages/Budgets/MonthProvider'
import { GoalPopover } from '2-pages/Budgets/GoalPopover/GoalPopover'
import { MoveMoneyModal } from '4-features/moveMoney/MoveMoneyModal'
import { SideContent, useSideContent } from '2-pages/Budgets/SideContent'

const meta = {
  title: 'UI/Dialogs and feedback',
  parameters: {
    layout: 'centered',
    app: { scenario: 'demo', globalWidgets: true },
  },
} satisfies Meta

export default meta
type Story = StoryObj

function DialogTriggers() {
  const confirm = useConfirm({
    title: 'Delete this operation?',
    description: 'This story demonstrates the application confirmation dialog.',
    okText: 'Delete',
    cancelText: 'Cancel',
    onOk: () => undefined,
  })
  const showSnackbar = useSnackbar()

  return (
    <div className="flex gap-2">
      <Button variant="contained" onClick={confirm}>
        Open confirmation
      </Button>
      <Button onClick={() => showSnackbar({ message: 'Saved in the story' })}>
        Show snackbar
      </Button>
    </div>
  )
}

export const Interactive: Story = { render: () => <DialogTriggers /> }

function MonthConfirmationHarness() {
  const openSide = useSideContent()
  return (
    <>
      <button type="button" onClick={() => openSide('overview')}>
        Open month overview
      </button>
      <SideContent width={360} />
    </>
  )
}

/** The confirmation lives in GlobalWidgets, outside the MUI drawer's React
 * tree. Both responsive variants must keep focus and dismiss only themselves. */
export const ConfirmFromDrawer: Story = {
  globals: { viewport: { value: 'zerro900' } },
  render: () => (
    <MonthProvider>
      <MonthConfirmationHarness />
    </MonthProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const opener = canvas.getByRole('button', { name: 'Open month overview' })
    await userEvent.click(opener)
    const parent = await body.findByRole('dialog')
    const trigger = within(parent).getByRole('button', {
      name: 'Copy from last month',
    })
    await userEvent.click(trigger)
    const child = await body.findByRole('dialog', { name: 'Copy all budgets?' })
    const expectChildFocus = () =>
      expect(child).toContainElement(
        canvasElement.ownerDocument.activeElement as HTMLElement
      )
    await waitFor(expectChildFocus)
    await waitFor(() =>
      expect(within(child).getByRole('button', { name: 'Copy' })).toHaveFocus()
    )
    await userEvent.tab({ shift: true })
    await waitFor(() =>
      expect(
        within(child).getByRole('button', { name: 'Cancel' })
      ).toHaveFocus()
    )
    for (let i = 0; i < 3; i++) {
      await userEvent.tab()
      await waitFor(expectChildFocus)
    }
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(child).not.toBeVisible())
    await expect(parent).toBeVisible()
    await waitFor(() => expect(trigger).toHaveFocus())

    await userEvent.keyboard('{Enter}')
    const reopened = await body.findByRole('dialog', {
      name: 'Copy all budgets?',
    })
    await userEvent.click(
      within(reopened).getByRole('button', { name: 'Cancel' })
    )
    await waitFor(() => expect(reopened).not.toBeVisible())
    await expect(parent).toBeVisible()
    await waitFor(() => expect(trigger).toHaveFocus())
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(parent).not.toBeVisible())
    await waitFor(() => expect(opener).toHaveFocus())
  },
}

export const ConfirmFromMobileDrawer: Story = {
  ...ConfirmFromDrawer,
  globals: { viewport: { value: 'iphone13' } },
}

function AmountDialogHarness({ kind }: { kind: 'goal' | 'move' }) {
  const [month] = useMonth()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const id = Object.values(useAppSelector(core.envelopes.selectAll)).find(
    envelope => envelope.name === 'Food'
  )!.id
  const commands = useAppSelector(state => state.data.outbox.length)
  return (
    <>
      <button type="button" onClick={event => setAnchor(event.currentTarget)}>
        Open amount editor
      </button>
      <output data-testid="commands">{commands}</output>
      {kind === 'goal' ? (
        <GoalPopover
          id={id}
          month={month}
          open={!!anchor}
          anchorEl={anchor}
          onClose={() => setAnchor(null)}
        />
      ) : (
        <MoveMoneyModal
          month={month}
          source="toBeAssigned"
          destination={id}
          open={!!anchor}
          onClose={() => setAnchor(null)}
        />
      )}
    </>
  )
}

const checkAmountDialog: Story['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const body = within(canvasElement.ownerDocument.body)
  const commands = Number(canvas.getByTestId('commands').textContent)
  await userEvent.click(
    canvas.getByRole('button', { name: 'Open amount editor' })
  )
  const input = await body.findByPlaceholderText('0')
  await userEvent.click(input)
  await userEvent.clear(input)
  await userEvent.type(input, '25,5+4.5{Enter}')
  await waitFor(() => expect(input).not.toBeVisible())
  await expect(Number(canvas.getByTestId('commands').textContent)).toBe(
    commands + 1
  )
}

export const GoalAmountRegression: Story = {
  render: () => (
    <MonthProvider>
      <AmountDialogHarness kind="goal" />
    </MonthProvider>
  ),
  play: checkAmountDialog,
}

export const MoveMoneyAmountRegression: Story = {
  render: () => (
    <MonthProvider>
      <AmountDialogHarness kind="move" />
    </MonthProvider>
  ),
  play: checkAmountDialog,
}
