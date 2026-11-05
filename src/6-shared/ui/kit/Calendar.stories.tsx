import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { toISODate } from '@/6-shared/helpers/date'
import { Button } from './Button'
import { Calendar, type CalendarProps } from './Calendar'
import { Dialog } from './Dialog'
import { Drawer } from './Drawer'

const meta = {
  title: 'UI Kit/Inputs/Calendar',
  component: Calendar,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A controlled single-date calendar with six weeks and visible outside days. Use <Calendar value={date} onChange={setDate} /> inside any surface. value is a local YYYY-MM-DD date or null; clicking the selected day keeps it selected. minDate/maxDate are inclusive. defaultMonth sets the initial view when empty; later value changes reveal the selected month. Month and year are separate selects with text-only triggers. The month list follows the displayed year. Each unbounded year-list end extends five years from the displayed year; explicit bounds replace it. Changing the year keeps the month when allowed, otherwise uses the nearest bound. Navigation does not change the value. The month selector uses the kit Select and requires OverlayHost inside a Router; Back or Escape dismisses it before the parent surface. The parent owns the calendar surface and form validation. Month changes use DayPicker’s built-in animation with a 10px crossfade; reduced motion uses only a fade, and keyboard day navigation stays immediate. No range selection or date input is included.',
      },
    },
  },
  args: {
    value: '2026-02-15',
    defaultMonth: '2026-02-01',
    onChange: fn(),
  },
} satisfies Meta<typeof Calendar>
export default meta
type Story = StoryObj<typeof meta>

function Example(props: CalendarProps) {
  const [value, setValue] = useState(props.value)
  return (
    <div className="grid justify-items-center gap-3">
      <Calendar
        {...props}
        value={value}
        onChange={date => {
          setValue(date)
          props.onChange(date)
        }}
      />
      <output
        aria-label="Selected date"
        className="text-ui-14 text-ui-secondary"
      >
        {value ?? 'No date selected'}
      </output>
    </div>
  )
}

export const Playground: Story = { render: args => <Example {...args} /> }

export const Showcase: Story = {
  render: args => (
    <div className="flex flex-wrap justify-center gap-8 p-4">
      {[
        { title: 'Empty', value: null },
        {
          title: 'Selection and bounds',
          value: '2026-02-15' as const,
          minDate: '2026-02-10' as const,
          maxDate: '2026-03-05' as const,
        },
        { title: 'Today selected', value: toISODate(new Date()) },
      ].map(({ title, ...props }) => (
        <section key={title} className="grid gap-3">
          <h2 className="text-ui-16 font-medium text-ui-primary">{title}</h2>
          <div className="rounded-ui-card rounded-smooth bg-ui-card p-2">
            <Example {...args} {...props} />
          </div>
        </section>
      ))}
    </div>
  ),
}

function day(container: HTMLElement, date: string) {
  const grid = within(container).getByRole('grid')
  return grid.querySelector<HTMLButtonElement>(`[data-day="${date}"] button`)!
}

async function settled(container: HTMLElement, month: string) {
  await waitFor(() => {
    expect(within(container).getByRole('grid', { name: month })).toBeVisible()
    expect(
      container.querySelector('[data-animated-month][aria-hidden="true"]')
    ).toBeNull()
  })
}

export const Navigation: Story = {
  ...Playground,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const initialHeight = canvas
      .getByRole('grid')
      .getBoundingClientRect().height
    const next = canvas.getByRole('button', { name: 'Next month' })
    const previous = canvas.getByRole('button', { name: 'Previous month' })
    await expect(canvas.getAllByRole('gridcell')).toHaveLength(42)
    await userEvent.click(next)
    await settled(canvasElement, 'March 2026')
    await expect(canvas.getAllByRole('gridcell')).toHaveLength(42)
    await expect(canvas.getByRole('grid').getBoundingClientRect().height).toBe(
      initialHeight
    )
    // Rapid direction changes must leave the final month usable, with no clone.
    await userEvent.click(next)
    await userEvent.click(next)
    await userEvent.click(previous)
    await settled(canvasElement, 'April 2026')
    await expect(canvas.getAllByRole('gridcell')).toHaveLength(42)
    await expect(args.onChange).not.toHaveBeenCalled()
    await userEvent.click(day(canvasElement, '2026-05-01'))
    await settled(canvasElement, 'May 2026')
    await expect(
      canvas.getByRole('status', { name: 'Selected date' })
    ).toHaveTextContent('2026-05-01')
  },
}

export const MonthSelection: Story = {
  ...Playground,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole('combobox', {
      name: 'Select month: February',
    })
    await userEvent.click(trigger)
    const list = await body.findByRole('listbox', { name: 'Select month' })
    const selected = within(list).getByRole('option', { name: 'February' })
    await expect(selected).toHaveAttribute('aria-selected', 'true')
    await waitFor(() => {
      const bounds = list.getBoundingClientRect()
      const rect = selected.getBoundingClientRect()
      expect(rect.top).toBeGreaterThanOrEqual(bounds.top)
      expect(rect.bottom).toBeLessThanOrEqual(bounds.bottom)
    })
    await userEvent.click(within(list).getByRole('option', { name: 'March' }))
    await settled(canvasElement, 'March 2026')
    await waitFor(() =>
      expect(body.queryByRole('listbox')).not.toBeInTheDocument()
    )
    await expect(trigger).toHaveFocus()
    await expect(args.onChange).not.toHaveBeenCalled()
    await expect(
      canvas.getByRole('status', { name: 'Selected date' })
    ).toHaveTextContent('2026-02-15')
    const yearTrigger = canvas.getByRole('combobox', {
      name: 'Select year: 2026',
    })
    await userEvent.click(yearTrigger)
    const years = await body.findByRole('listbox', { name: 'Select year' })
    await expect(
      within(years).getByRole('option', { name: '2026' })
    ).toHaveAttribute('aria-selected', 'true')
    await userEvent.keyboard('{ArrowDown}{Enter}')
    await settled(canvasElement, 'March 2027')
    await waitFor(() => expect(yearTrigger).toHaveFocus())
    await expect(args.onChange).not.toHaveBeenCalled()
  },
}

export const YearBounds: Story = {
  ...Playground,
  args: { value: '2026-01-15', minDate: '2025-02-10', maxDate: '2027-03-05' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const yearTrigger = canvas.getByRole('combobox', { name: /^Select year:/ })
    await userEvent.click(yearTrigger)
    const years = await body.findByRole('listbox', { name: 'Select year' })
    await expect(
      within(years)
        .getAllByRole('option')
        .map(option => option.textContent)
    ).toEqual(['2025', '2026', '2027'])
    await userEvent.click(within(years).getByRole('option', { name: '2025' }))
    await settled(canvasElement, 'February 2025')
    await waitFor(() => expect(yearTrigger).toHaveFocus())
    await userEvent.click(
      canvas.getByRole('combobox', { name: /^Select month:/ })
    )
    const months = await body.findByRole('listbox', { name: 'Select month' })
    await expect(
      within(months).queryByRole('option', { name: 'January' })
    ).not.toBeInTheDocument()
    await userEvent.click(
      within(months).getByRole('option', { name: 'December' })
    )
    await settled(canvasElement, 'December 2025')
    await userEvent.click(yearTrigger)
    const nextYears = await body.findByRole('listbox', { name: 'Select year' })
    await userEvent.click(
      within(nextYears).getByRole('option', { name: '2027' })
    )
    await settled(canvasElement, 'March 2027')
    await expect(args.onChange).not.toHaveBeenCalled()
  },
}

export const MonthTransition: Story = {
  ...Playground,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const transitions: { outgoing: boolean; inert: boolean; x: number[] }[] = []
    const observe = (event: AnimationEvent) => {
      const target = event.target
      if (!(target instanceof HTMLElement) || !target.closest('[role="grid"]'))
        return
      const outgoing = target.closest<HTMLElement>('[aria-hidden="true"]')
      for (const animation of target.getAnimations()) {
        const frames = (animation.effect as KeyframeEffect).getKeyframes()
        transitions.push({
          outgoing: Boolean(outgoing),
          inert: outgoing?.inert ?? false,
          x: frames.map(frame => new DOMMatrix(String(frame.transform)).m41),
        })
      }
    }
    canvasElement.addEventListener('animationstart', observe)
    try {
      await userEvent.click(
        within(canvasElement).getByRole('button', { name: 'Next month' })
      )
      await settled(canvasElement, 'March 2026')
      const entering = transitions.find(transition => !transition.outgoing)
      const leaving = transitions.find(transition => transition.outgoing)
      await expect(entering).toBeDefined()
      await expect(leaving?.inert).toBe(true)
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        await expect(
          transitions.every(transition => transition.x.every(x => x === 0))
        ).toBe(true)
      } else {
        await expect(entering!.x[0]).toBeGreaterThan(0)
        await expect(leaving!.x.at(-1)).toBeLessThan(0)
      }
    } finally {
      canvasElement.removeEventListener('animationstart', observe)
    }
  },
}

export const Bounds: Story = {
  ...Playground,
  args: { minDate: '2026-02-10', maxDate: '2026-03-05' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const initialHeight = canvas
      .getByRole('grid')
      .getBoundingClientRect().height
    await expect(day(canvasElement, '2026-02-09')).toBeDisabled()
    await expect(day(canvasElement, '2026-02-10')).toBeEnabled()
    const body = within(canvasElement.ownerDocument.body)
    const monthTrigger = canvas.getByRole('combobox', {
      name: /^Select month:/,
    })
    await userEvent.click(monthTrigger)
    const list = await body.findByRole('listbox')
    await expect(
      within(list)
        .getAllByRole('option')
        .map(option => option.textContent)
    ).toEqual(['February', 'March'])
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(monthTrigger).toHaveFocus())
    const previous = canvas.getByRole('button', { name: 'Previous month' })
    const next = canvas.getByRole('button', { name: 'Next month' })
    await expect(previous).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(next)
    await settled(canvasElement, 'March 2026')
    // The last week is entirely outside the final allowed month.
    await expect(canvas.getByRole('grid').getBoundingClientRect().height).toBe(
      initialHeight
    )
    await expect(next).toHaveAttribute('aria-disabled', 'true')
    await expect(day(canvasElement, '2026-03-06')).toBeDisabled()
    await userEvent.click(day(canvasElement, '2026-03-05'))
    await expect(
      canvas.getByRole('status', { name: 'Selected date' })
    ).toHaveTextContent('2026-03-05')
  },
}

export const Keyboard: Story = {
  ...Playground,
  args: { value: '2026-02-28' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    day(canvasElement, '2026-02-28').focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(day(canvasElement, '2026-03-01')).toHaveFocus()
    await expect(canvas.getByRole('grid', { name: 'March 2026' })).toBeVisible()
    await userEvent.keyboard('{ArrowDown}{Enter}')
    await expect(day(canvasElement, '2026-03-08')).toHaveFocus()
    await expect(
      day(canvasElement, '2026-03-08').closest('[role="gridcell"]')
    ).toHaveAttribute('aria-selected', 'true')
    await userEvent.keyboard('{Enter}')
    await expect(
      canvas.getByRole('status', { name: 'Selected date' })
    ).toHaveTextContent('2026-03-08')
  },
}

export const Russian: Story = {
  ...Playground,
  globals: { locale: 'ru' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('combobox', { name: 'Выбрать месяц: февраль' })
    ).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: 'Предыдущий месяц' })
    ).toBeVisible()
    await expect(day(canvasElement, '2026-02-15')).toHaveAccessibleName(
      'воскресенье, 15 февраля 2026 г.'
    )
  },
}

const checkSurface: Story['play'] = async ({ canvasElement }) => {
  const trigger = within(canvasElement).getByRole('button', {
    name: 'Choose date',
  })
  await userEvent.click(trigger)
  const dialog = await within(canvasElement.ownerDocument.body).findByRole(
    'dialog',
    {
      name: 'Choose date',
    }
  )
  await waitFor(() =>
    expect(dialog).toContainElement(document.activeElement as HTMLElement)
  )
  const body = within(canvasElement.ownerDocument.body)
  const monthTrigger = within(dialog).getByRole('combobox', {
    name: /^Select month:/,
  })
  await userEvent.click(monthTrigger)
  await body.findByRole('listbox', { name: 'Select month' })
  await userEvent.keyboard('{Escape}')
  await waitFor(() =>
    expect(body.queryByRole('listbox')).not.toBeInTheDocument()
  )
  await expect(dialog).toBeVisible()
  await expect(monthTrigger).toHaveFocus()
  await userEvent.click(monthTrigger)
  const months = await body.findByRole('listbox', { name: 'Select month' })
  await userEvent.click(within(months).getByRole('option', { name: 'March' }))
  await waitFor(() =>
    expect(body.queryByRole('listbox')).not.toBeInTheDocument()
  )
  await settled(dialog, 'March 2026')
  await userEvent.click(day(dialog, '2026-03-20'))
  await expect(
    within(dialog).getByRole('status', { name: 'Selected date' })
  ).toHaveTextContent('2026-03-20')
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(dialog).not.toBeVisible())
  await waitFor(() => expect(trigger).toHaveFocus())
}

export const InDialog: Story = {
  render: args => (
    <Dialog title="Choose date" trigger={<Button>Choose date</Button>}>
      <Example {...args} />
    </Dialog>
  ),
  play: checkSurface,
}

export const InBottomSheet: Story = {
  globals: { viewport: { value: 'mobile1' } },
  render: args => (
    <Drawer
      side="bottom"
      title="Choose date"
      trigger={<Button>Choose date</Button>}
    >
      <Example {...args} />
    </Drawer>
  ),
  play: checkSurface,
}
