import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { useAppSelector } from 'store'
import { core } from 'zerro-core/redux'
import { MonthProvider, useMonth } from '../MonthProvider'
import { SmartBudgetPopover, useBudgetPopover } from './Context'
import { useNavigate } from 'react-router-dom'
import { SideContent, useSideContent } from '../SideContent'

const meta = {
  title: 'Budget/Assignment popover',
  parameters: { app: { scenario: 'demo', route: '/budget' } },
} satisfies Meta

export default meta
type Story = StoryObj

function AssignmentHarness() {
  const navigate = useNavigate()
  const [, setCurrency] = core.currency.useDisplayCurrency()
  const [month] = useMonth()
  const open = useBudgetPopover()
  const envelopes = useAppSelector(core.envelopes.selectAll)
  const metrics = useAppSelector(core.activity.selectEnvelopeMetrics)[month]
  const convert = useAppSelector(core.currency.selectConvertFx)
  const commands = useAppSelector(state => state.data.outbox.length)
  const id = Object.values(envelopes).find(
    envelope => envelope.name === 'Food'
  )!.id
  const envelope = metrics[id]

  return (
    <div
      onKeyDownCapture={event => {
        if (event.altKey && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
          event.preventDefault()
          navigate(event.key === 'ArrowLeft' ? -1 : 1)
        }
      }}
    >
      <button type="button" onClick={event => open(id, event.currentTarget)}>
        Assign budget
      </button>
      <output data-testid="assigned">
        {convert(envelope.totalAssigned, envelope.currency, month)}
      </output>
      <output data-testid="commands">{commands}</output>
      <button type="button" onClick={() => setCurrency('USD')}>
        Display USD
      </button>
      <SmartBudgetPopover />
    </div>
  )
}

const checkAssignment: Story['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const body = within(canvasElement.ownerDocument.body)
  const trigger = canvas.getByRole('button', { name: 'Assign budget' })
  const commandCount = () => Number(canvas.getByTestId('commands').textContent)
  const initialCommands = commandCount()
  await userEvent.click(trigger)
  let input = await body.findByPlaceholderText('0')
  const popup = input.closest<HTMLElement>(
    // A drawer on a phone, the owned `Popover` above the breakpoint.
    '[data-slot="adaptive-popup"], [data-slot="popover"]'
  )!
  await expect(popup.getAttribute('data-placement')).toBe(
    window.innerWidth < 900 ? 'top' : null
  )
  await waitFor(() => {
    const rect = popup.getBoundingClientRect()
    expect(rect.left).toBeGreaterThanOrEqual(0)
    expect(rect.right).toBeLessThanOrEqual(window.innerWidth)
    expect(rect.top).toBeGreaterThanOrEqual(0)
  })
  // The surface, its field and its quick-amount list each carry a name of
  // their own, and the apply button sits over the field's own padding.
  const dialog = input.closest<HTMLElement>('[role="dialog"]')!
  const list = popup.querySelector<HTMLElement>('[data-slot="action-list"]')!
  const names = [
    dialog.getAttribute('aria-label'),
    input.getAttribute('aria-label'),
    list.getAttribute('aria-label'),
  ]
  await expect(new Set(names).size).toBe(3)
  await expect(names.every(Boolean)).toBe(true)
  const apply = body.getByRole('button', { name: 'Apply' })
  await expect(getComputedStyle(apply).marginRight).toBe('-12px')

  await userEvent.clear(input)
  await userEvent.type(input, '1,5+2*3{Enter}')
  await waitFor(() =>
    expect(canvas.getByTestId('assigned')).toHaveTextContent(/^7.5$/)
  )
  await waitFor(() => expect(input).not.toBeVisible())
  await expect(commandCount()).toBe(initialCommands + 1)
  await waitFor(() => expect(trigger).toHaveFocus())

  // Reopening starts from the saved amount. Dismissing unchanged must not
  // enqueue another command; dismissal after an edit still applies the value.
  await userEvent.click(trigger)
  input = await body.findByPlaceholderText('0')
  await userEvent.click(input)
  await expect(input).toHaveValue('7.5')
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(input).not.toBeVisible())
  await expect(commandCount()).toBe(initialCommands + 1)
  await userEvent.click(trigger)
  input = await body.findByPlaceholderText('0')
  await userEvent.clear(input)
  await userEvent.type(input, '-12.5{Escape}')
  await waitFor(() =>
    expect(canvas.getByTestId('assigned')).toHaveTextContent(/^-12.5$/)
  )
  await expect(commandCount()).toBe(initialCommands + 2)
  await waitFor(() => expect(trigger).toHaveFocus())

  await userEvent.click(trigger)
  input = await body.findByPlaceholderText('0')
  await userEvent.click(input)
  await userEvent.tab()
  await expect(body.getByRole('button', { name: 'Apply' })).toHaveFocus()
  await userEvent.tab()
  // Toolbar semantics, not menu: scoped to the list so the field's own Apply
  // button does not count as one of the quick amounts.
  const quickAmounts = body.getByRole('toolbar', { name: 'Quick amounts' })
  const actions = within(quickAmounts).getAllByRole('button')
  await expect(actions[0]).toHaveFocus()
  await userEvent.keyboard('{End}')
  await expect(actions.at(-1)).toHaveFocus()
  await userEvent.keyboard('{Home}')
  await expect(actions[0]).toHaveFocus()
  if (actions.length > 1) {
    await userEvent.keyboard('{ArrowDown}')
    await expect(actions[1]).toHaveFocus()
  }
  await userEvent.keyboard('{End}')
  await userEvent.keyboard(actions[0].textContent!.trim()[0])
  await expect(actions[0]).toHaveFocus()
  await userEvent.keyboard('{Enter}')
  await waitFor(() => expect(input).not.toBeVisible())
  await expect(commandCount()).toBe(initialCommands + 3)
  await waitFor(() => expect(trigger).toHaveFocus())
  await userEvent.click(trigger)
  input = await body.findByRole('textbox', { name: 'Assigned' })
  await userEvent.clear(input)
  await userEvent.type(input, '42.25')
  await userEvent.click(body.getByRole('button', { name: 'Apply' }))
  await waitFor(() => expect(input).not.toBeVisible())
  await expect(canvas.getByTestId('assigned')).toHaveTextContent(/^42.25$/)
  await expect(commandCount()).toBe(initialCommands + 4)
}

export const Desktop: Story = {
  render: () => (
    <MonthProvider>
      <AssignmentHarness />
    </MonthProvider>
  ),
  play: checkAssignment,
}

export const Mobile: Story = {
  ...Desktop,
  globals: { viewport: { value: 'iphone13' } },
}

export const Dark: Story = {
  ...Desktop,
  globals: { theme: 'dark' },
}

export const BelowBreakpoint: Story = {
  ...Desktop,
  globals: { viewport: { value: 'zerro899' } },
}

export const AtBreakpoint: Story = {
  ...Desktop,
  globals: { viewport: { value: 'zerro900' } },
}

export const HistoryDraft: Story = {
  ...Desktop,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole('button', { name: 'Assign budget' })
    const assigned = canvas.getByTestId('assigned').textContent
    const commands = canvas.getByTestId('commands').textContent
    await userEvent.click(trigger)
    const input = await body.findByRole('textbox', { name: 'Assigned' })
    await userEvent.clear(input)
    await userEvent.type(input, '123')
    await userEvent.keyboard('{Alt>}{ArrowLeft}{/Alt}')
    await waitFor(() => expect(input).not.toBeVisible())
    await expect(canvas.getByTestId('assigned').textContent).toBe(assigned)
    await expect(canvas.getByTestId('commands').textContent).toBe(commands)
    await waitFor(() => expect(trigger).toHaveFocus())
    await userEvent.keyboard('{Alt>}{ArrowRight}{/Alt}')
    const restored = await body.findByRole('textbox', { name: 'Assigned' })
    await expect(restored).toHaveValue('123')
    await userEvent.keyboard('{Escape}')
    await waitFor(() =>
      expect(canvas.getByTestId('assigned')).toHaveTextContent(/^123$/)
    )
  },
}

export const MobileHistoryDraft: Story = {
  ...HistoryDraft,
  globals: { viewport: { value: 'iphone13' } },
}

function NestedAssignmentHarness() {
  const openSide = useSideContent()
  const id = Object.values(useAppSelector(core.envelopes.selectAll)).find(
    envelope => envelope.name === 'Groceries'
  )!.id
  return (
    <>
      <button type="button" onClick={() => openSide(id)}>
        Open category details
      </button>
      <SideContent width={360} />
      <SmartBudgetPopover />
    </>
  )
}

export const NestedDrawer: Story = {
  globals: { viewport: { value: 'zerro900' } },
  render: () => (
    <MonthProvider>
      <NestedAssignmentHarness />
    </MonthProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      canvas.getByRole('button', { name: 'Open category details' })
    )
    const parent = await body.findByRole('dialog')
    const trigger = within(parent).getByRole('button', { name: /^Assigned / })
    await userEvent.click(trigger)
    const input = await body.findByRole('textbox', { name: 'Assigned' })
    const child = input.closest('[role="dialog"]')!
    await waitFor(() => expect(input).toHaveFocus())
    // The child no longer sits inside the parent's DOM. MUI's drawer needed
    // that — its focus trap could not know about a Base UI surface elsewhere
    // in the document — and now that both are Base UI, they layer themselves.
    // What has to hold is the behaviour the nesting bought: focus stays in
    // the child, Escape takes the top surface only, and the parent gets its
    // trigger back.
    await userEvent.tab()
    await waitFor(() =>
      expect(child).toContainElement(
        canvasElement.ownerDocument.activeElement as HTMLElement
      )
    )
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(child).not.toBeVisible())
    await expect(parent).toBeVisible()
    await waitFor(() => expect(trigger).toHaveFocus())
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(parent).not.toBeVisible())
  },
}

export const NestedMobileDrawer: Story = {
  ...NestedDrawer,
  globals: { viewport: { value: 'iphone13' } },
}

export const ForeignDisplayCurrency: Story = {
  ...Desktop,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Display USD' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Assign budget' }))
    const input = await body.findByRole('textbox', { name: 'Assigned' })
    await userEvent.clear(input)
    await userEvent.type(input, '100')
    await expect(input).toHaveAccessibleDescription(/\$.*Balance.*₽.*\$/)
    await userEvent.keyboard('{Escape}')
  },
}
