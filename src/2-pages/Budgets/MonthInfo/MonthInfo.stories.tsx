import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { useAppDispatch, useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'
import { GoalsProgress } from '@/4-features/bulkActions/fillGoals/ui/GoalsProgress'
import { MonthProvider, useMonth } from '../MonthProvider'
import { HistoryControls } from '@/3-widgets/History/HistoryControls'
import { SideContent, useSideContent } from '../SideContent'
import { MonthInfo } from './index'

const meta = {
  title: 'App/Budgets/MonthInfo',
  component: MonthInfo,
  tags: ['!dev', '!autodocs'],
  parameters: { app: { scenario: 'demo' } },
} satisfies Meta<typeof MonthInfo>
export default meta
type Story = StoryObj<typeof meta>

function Harness({ drawer = false }: { drawer?: boolean }) {
  const openSide = useSideContent()
  const dispatch = useAppDispatch()
  const [month, setMonth] = useMonth()
  const envelopes = useAppSelector(core.envelopes.selectAll)
  const current = useAppSelector(state => state.data.current)
  const pending = useAppSelector(state => state.data.outbox.length)
  return (
    <>
      <button
        onClick={() => {
          const id = Object.values(envelopes).find(
            item => item.name === 'Food'
          )!.id
          dispatch(
            core.budgets.set([
              { id, month: '2026-02', value: 321 },
              { id, month: '2026-03', value: 0 },
            ])
          )
          dispatch(
            core.goals.set('2026-03', id, {
              type: core.goals.goalType.MONTHLY,
              amount: 10000,
            })
          )
          setMonth('2026-03')
        }}
      >
        Prepare budgets
      </button>
      {!drawer && <HistoryControls />}
      <output aria-label="Pending actions">{pending}</output>
      <output aria-label="Current data" hidden>
        {JSON.stringify(current)}
      </output>
      {drawer ? (
        <>
          <button onClick={() => openSide('overview')}>Open overview</button>
          <SideContent />
        </>
      ) : (
        <MonthInfo />
      )}
      <GoalsProgress month={month} aria-label="Fill goals from progress" />
    </>
  )
}

export const DirectActionsAndUndo: Story = {
  render: () => (
    <MonthProvider>
      <Harness />
    </MonthProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      canvas.getByRole('button', { name: 'Prepare budgets' })
    )
    for (const name of [
      'Copy from last month',
      'Complete all goals',
      'Fill goals from progress',
    ]) {
      const before = canvas.getByLabelText('Current data').textContent
      const pending = Number(
        canvas.getByLabelText('Pending actions').textContent
      )
      await userEvent.click(canvas.getByRole('button', { name }))
      await waitFor(() =>
        expect(canvas.getByLabelText('Pending actions')).toHaveTextContent(
          String(pending + 1)
        )
      )
      expect(body.queryByRole('alertdialog')).toBeNull()
      expect(body.queryByRole('dialog')).toBeNull()
      expect(canvas.getByLabelText('Current data').textContent).not.toBe(before)
      const notices = await body.findAllByRole('status', {
        name:
          name === 'Copy from last month'
            ? 'Budgets copied'
            : 'Budgets set to meet goals',
      })
      for (const notice of notices)
        expect(
          within(notice).queryByRole('button', { name: 'Undo' })
        ).toBeNull()
      await userEvent.click(canvas.getByRole('button', { name: 'Undo' }))
      await waitFor(() =>
        expect(canvas.getByLabelText('Current data').textContent).toBe(before)
      )
      expect(canvas.getByLabelText('Pending actions')).toHaveTextContent(
        String(pending)
      )
    }
  },
}

export const MessageInsideDrawer: Story = {
  globals: { viewport: { value: 'zerro900' } },
  render: () => (
    <MonthProvider>
      <Harness drawer />
    </MonthProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      canvas.getByRole('button', { name: 'Prepare budgets' })
    )
    const before = canvas.getByLabelText('Current data').textContent
    await userEvent.click(canvas.getByRole('button', { name: 'Open overview' }))
    const drawer = await body.findByRole('dialog')
    await userEvent.click(
      within(drawer).getByRole('button', { name: 'Copy from last month' })
    )
    await body.findByText('Budgets copied')
    expect(body.queryByRole('button', { name: 'Undo' })).toBeNull()
    expect(canvas.getByLabelText('Current data').textContent).not.toBe(before)
    await expect(drawer).toBeVisible()
  },
}
export const MessageInsideMobileDrawer: Story = {
  ...MessageInsideDrawer,
  globals: { viewport: { value: 'zerro499' } },
}
