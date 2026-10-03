import type { Meta, StoryObj } from '@storybook/react-vite'
import { usePopup } from '@/6-shared/overlays'
import { Button } from '@/6-shared/ui/kit/Button'
import { MoveMoneyModal } from '@/4-features/moveMoney'
import { core } from '@/zerro-core/redux'
import { useAppSelector } from '@/store'
import { MonthProvider, useMonth } from './MonthProvider'
import { useBudgetPopover } from './BudgetPopover'
import { BudgetCell } from './EnvelopeTable/Row/BudgetCell'
import { useGoalPopover } from './GoalPopover'

const meta = {
  title: 'App/Budgets/BudgetEditors',
  parameters: {
    app: { scenario: 'demo', route: '/budget' },
    layout: 'padded',
    docs: {
      description: {
        story:
          'Demo data only. Budget edits apply on Enter, Apply, Escape or outside click; Back cancels. Move money applies explicitly. Goal edits save explicitly; Escape closes the nested month picker first. Reopen editors to inspect saved values, and switch currency or viewport to compare presentations.',
      },
    },
  },
} satisfies Meta
export default meta
type Story = StoryObj

/** Real editors and demo store. No play function: changes stay on screen so
 * this is also a manual review surface, independent of the regression tests. */
function Editors() {
  const [month] = useMonth()
  const budget = useBudgetPopover()
  const goal = useGoalPopover()
  const move = usePopup()
  const [currency, setCurrency] = core.currency.useDisplayCurrency()
  const envelopes = useAppSelector(core.envelopes.selectAll)
  const id = Object.values(envelopes).find(item => item.name === 'Food')!.id
  const metrics = useAppSelector(core.activity.selectEnvelopeMetrics)[month][id]
  const savedGoal = useAppSelector(core.goals.selectAll)[month][id]?.goal
  const convert = useAppSelector(core.currency.selectConvertFx)
  return (
    <main className="mx-auto grid max-w-160 gap-6 p-4 text-ui-16 text-ui-primary">
      <h1 className="text-ui-20 font-medium">Budget editors</h1>
      <div className="flex items-center justify-between rounded-ui-card bg-ui-card p-4">
        <span>Food · Assigned ({currency})</span>
        <BudgetCell
          value={convert(metrics.totalAssigned, currency, month)}
          onBudgetClick={anchor => budget(id, anchor, { alignAmount: true })}
        />
      </div>
      <div className="grid gap-3">
        <Button onClick={event => budget(id, event.currentTarget)}>
          1. Assign budget
        </Button>
        <Button variant="secondary" onClick={() => move.setOpen(true)}>
          2. Move money to Food
        </Button>
        <Button
          variant="secondary"
          onClick={event => goal(id, event.currentTarget)}
        >
          3. Edit goal
        </Button>
      </div>
      <div className="grid gap-2 rounded-ui-card bg-ui-card p-4">
        <h2 className="font-medium">Saved · Food · {month}</h2>
        <output>
          Assigned:{' '}
          {convert(metrics.totalAssigned, envelopes[id].currency, month)}{' '}
          {envelopes[id].currency}
        </output>
        <output className="break-words">
          Goal: {savedGoal ? JSON.stringify(savedGoal) : 'none'}
        </output>
        <Button
          variant="outline"
          onClick={() => setCurrency(currency === 'USD' ? 'RUB' : 'USD')}
        >
          Display currency: {currency}
        </Button>
      </div>
      <MoveMoneyModal
        key={String(move.open)}
        open={move.open}
        onClose={() => move.setOpen(false)}
        month={month}
        source="toBeAssigned"
        destination={id}
      />
    </main>
  )
}

export const Desktop: Story = {
  render: () => (
    <MonthProvider>
      <Editors />
    </MonthProvider>
  ),
}
export const Mobile: Story = {
  ...Desktop,
  globals: { viewport: { value: 'iphone13' } },
}
