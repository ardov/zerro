import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { core } from '@/zerro-core/redux'
import { formatDate, toISOMonth } from '@/6-shared/helpers/date'
import { MonthProvider, useMonth } from '@/2-pages/Budgets/MonthProvider'
import { SideContent, useSideContent } from '@/2-pages/Budgets/SideContent'
import { useGoalPopover } from './Context'
import { GoalPopover } from './GoalPopover'
import { useAppSelector } from '@/store'

const meta = {
  title: 'App/Budgets/GoalPopover',
  component: GoalPopover,
  tags: ['autodocs'],
  parameters: {
    app: { scenario: 'demo', globalWidgets: true },
    layout: 'centered',
  },
} satisfies Meta<typeof GoalPopover>

export default meta
type Story = StoryObj

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

/** The confirmation lives in GlobalWidgets, outside the drawer's React tree.
 * Both responsive variants must keep focus and dismiss only themselves. */
export const ConfirmFromDrawer: Story = {
  tags: ['!dev', '!autodocs'],
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
    await expect(trigger.matches(':focus-visible')).toBe(false)
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(parent).not.toBeVisible())
    await waitFor(() => expect(opener).toHaveFocus())
  },
}

export const ConfirmFromMobileDrawer: Story = {
  ...ConfirmFromDrawer,
  tags: ['!dev', '!autodocs'],
  globals: { viewport: { value: 'iphone13' } },
}

function GoalAmountHarness() {
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
      <GoalPopover
        id={id}
        month={month}
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
      />
    </>
  )
}

export const GoalAmountRegression: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <MonthProvider>
      <GoalAmountHarness />
    </MonthProvider>
  ),
  play: async ({ canvasElement }) => {
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
  },
}

function GoalDraftHarness({ inDrawer = false }: { inDrawer?: boolean }) {
  const [month] = useMonth()
  const openGoal = useGoalPopover()
  const openSide = useSideContent()
  const id = Object.values(useAppSelector(core.envelopes.selectAll)).find(
    envelope => envelope.name === 'Food'
  )!.id
  const goal = useAppSelector(core.goals.selectAll)[month][id]?.goal
  return (
    <>
      <button
        type="button"
        onClick={event =>
          inDrawer ? openSide(id) : openGoal(id, event.currentTarget)
        }
      >
        Edit goal
      </button>
      <output className="sr-only" data-testid="saved-goal">
        {JSON.stringify(goal ?? null)}
      </output>
      {inDrawer && <SideContent width={360} />}
    </>
  )
}

/** Exercise the registered, keyed form: an ordinary component harness cannot
 * catch stale drafts across openings or history-driven dismissal. */
export const GoalDraftAndNestedMonth: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <MonthProvider>
      <GoalDraftHarness />
    </MonthProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole('button', { name: 'Edit goal' })
    const saved = canvas.getByTestId('saved-goal')
    const initial = saved.textContent
    await userEvent.click(trigger)
    const amount = await body.findByPlaceholderText('0')
    await waitFor(() => expect(amount).toHaveFocus())
    // A nested list is anchored to the field inside the animated surface.
    // Wait for that surface to settle before measuring/opening its child.
    await waitFor(() =>
      expect(
        getComputedStyle(amount.closest('[data-slot=popover]')!).opacity
      ).toBe('1')
    )
    const initialAmount = (amount as HTMLInputElement).value
    await userEvent.clear(amount)
    await userEvent.type(amount, '1234')
    await userEvent.click(body.getByRole('combobox', { name: 'Type of goal' }))
    await userEvent.click(
      await body.findByRole('option', { name: 'Save a sum' })
    )
    const dateTrigger = body.getByRole('button', { name: 'By a specific date' })
    await userEvent.click(dateTrigger)
    const month = toISOMonth(new Date())
    const monthButton = await body.findByRole('button', {
      name: formatDate(month, 'LLL').toUpperCase(),
    })
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(monthButton).not.toBeVisible())
    await waitFor(() => expect(dateTrigger).toHaveFocus())
    await expect(amount).toBeVisible()
    await userEvent.click(dateTrigger)
    await userEvent.click(
      await body.findByRole('button', {
        name: formatDate(month, 'LLL').toUpperCase(),
      })
    )
    await waitFor(() =>
      expect(dateTrigger).toHaveTextContent(
        formatDate(month, 'LLLL yyyy').toUpperCase()
      )
    )
    await expect(saved.textContent).toBe(initial)
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(amount).not.toBeVisible())
    await waitFor(() => expect(trigger).toHaveFocus())
    await expect(saved.textContent).toBe(initial)

    await userEvent.click(trigger)
    const fresh = await body.findByPlaceholderText('0')
    await waitFor(() =>
      expect(
        getComputedStyle(fresh.closest('[data-slot=popover]')!).opacity
      ).toBe('1')
    )
    await expect(fresh).toHaveValue(initialAmount)
    await expect(
      body.getByRole('combobox', { name: 'Type of goal' })
    ).toHaveTextContent('Monthly amount')
    await userEvent.clear(fresh)
    await userEvent.type(fresh, '250')
    await userEvent.click(body.getByRole('combobox', { name: 'Type of goal' }))
    await userEvent.click(
      await body.findByRole('option', { name: 'Save a sum' })
    )
    await userEvent.click(
      body.getByRole('button', { name: 'By a specific date' })
    )
    await userEvent.click(
      await body.findByRole('button', {
        name: formatDate(month, 'LLL').toUpperCase(),
      })
    )
    await userEvent.click(body.getByRole('button', { name: 'Save goal' }))
    await waitFor(() => expect(fresh).not.toBeVisible())
    await waitFor(() => expect(trigger).toHaveFocus())
    await expect(JSON.parse(saved.textContent!)).toEqual({
      type: core.goals.goalType.TARGET_BALANCE,
      amount: 250,
      end: `${month}-01`,
    })

    await userEvent.click(trigger)
    await userEvent.click(
      await body.findByRole('button', { name: 'Remove goal' })
    )
    await waitFor(() => expect(saved).toHaveTextContent('null'))
    await waitFor(() => expect(trigger).toHaveFocus())
  },
}

export const MobileGoalDraftAndNestedMonth: Story = {
  ...GoalDraftAndNestedMonth,
  tags: ['!dev', '!autodocs'],
  globals: { viewport: { value: 'iphone13' } },
}

export const GoalInsideDrawer: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { viewport: { value: 'zerro900' } },
  render: () => (
    <MonthProvider>
      <GoalDraftHarness inDrawer />
    </MonthProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Edit goal' }))
    const drawer = await body.findByRole('dialog')
    const trigger = within(drawer).getByRole('button', { name: 'Goal' })
    await userEvent.click(trigger)
    const goal = await body.findByRole('dialog', { name: 'Goal' })
    await waitFor(() => expect(getComputedStyle(goal).opacity).toBe('1'))
    await expect(within(goal).getByPlaceholderText('0')).toHaveFocus()
    await userEvent.click(
      within(goal).getByRole('combobox', { name: 'Type of goal' })
    )
    const list = await body.findByRole('listbox')
    await waitFor(() =>
      expect(list).toContainElement(document.activeElement as HTMLElement)
    )
    await userEvent.click(
      within(list).getByRole('option', { name: 'Save a sum' })
    )
    const dateTrigger = within(goal).getByRole('button', {
      name: 'By a specific date',
    })
    await userEvent.click(dateTrigger)
    const months = await body.findByRole('dialog', { name: 'Select month' })
    await waitFor(() =>
      expect(months).toContainElement(document.activeElement as HTMLElement)
    )
    for (let i = 0; i < 3; i++) {
      await userEvent.tab()
      await waitFor(() =>
        expect(months).toContainElement(document.activeElement as HTMLElement)
      )
    }
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(months).not.toBeVisible())
    await waitFor(() => expect(dateTrigger).toHaveFocus())
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(goal).not.toBeVisible())
    await expect(drawer).toBeVisible()
    await waitFor(() => expect(trigger).toHaveFocus())
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(drawer).not.toBeVisible())
  },
}

export const MobileGoalInsideDrawer: Story = {
  ...GoalInsideDrawer,
  tags: ['!dev', '!autodocs'],
  globals: { viewport: { value: 'iphone13' } },
}
