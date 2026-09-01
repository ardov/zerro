import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import type { TISODate } from '@/6-shared/types'
import { Calendar } from './Calendar'

/** August 2026 has its 1st on a Saturday and 31 days, so the grid it draws
 * starts and ends with outside days. Everything here is pinned to it rather
 * than to the clock. */
const AUGUST = '2026-08-15' as TISODate

const meta = {
  title: 'Library/Input/Calendar',
  component: Calendar,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { onChange: () => {}, value: AUGUST },
} satisfies Meta<typeof Calendar>
export default meta
type Story = StoryObj<typeof meta>

/** One component instance, entirely controlled by the Args panel. */
export const Bench: Story = {}

function Harness(props: { minDate?: TISODate; maxDate?: TISODate }) {
  const [value, setValue] = useState<TISODate>(AUGUST)
  return (
    <>
      <output data-testid="selected-date">{value}</output>
      <Calendar {...props} value={value} onChange={setValue} />
    </>
  )
}

const dayButton = (canvas: HTMLElement, date: TISODate) =>
  canvas.querySelector<HTMLButtonElement>(`[data-day="${date}"] button`)

export const Bounds: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Harness minDate="2026-08-10" maxDate="2026-09-05" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(dayButton(canvasElement, '2026-08-09')).toBeDisabled()
    await expect(dayButton(canvasElement, '2026-08-10')).toBeEnabled()
    // The month the range starts in is the first one the navigation reaches.
    await expect(
      canvas.getByRole('button', { name: 'Previous month' })
    ).toHaveAttribute('aria-disabled', 'true')
    const next = canvas.getByRole('button', { name: 'Next month' })
    await userEvent.click(next)
    await expect(canvas.getByText('September 2026')).toBeVisible()
    await expect(next).toHaveAttribute('aria-disabled', 'true')
    await expect(dayButton(canvasElement, '2026-09-06')).toBeDisabled()
    await userEvent.click(dayButton(canvasElement, '2026-09-04')!)
    await expect(canvas.getByTestId('selected-date')).toHaveTextContent(
      '2026-09-04'
    )
  },
}

export const Keyboard: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const selected = dayButton(canvasElement, AUGUST)!
    await expect(selected.closest('td')).toHaveAttribute(
      'aria-selected',
      'true'
    )
    selected.focus()
    // A calendar's arrows walk the grid by day and by week, which is the half
    // of this component that is worth taking from a library.
    await userEvent.keyboard('{ArrowRight}{ArrowDown}')
    await expect(dayButton(canvasElement, '2026-08-23')).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect(canvas.getByTestId('selected-date')).toHaveTextContent(
      '2026-08-23'
    )
  },
}

/** The month name comes from the `date-fns` locale the rest of the app
 * formats with, and Russian writes it in lower case — the caption puts the
 * first letter back up. */
export const Russian: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Harness />,
  globals: { locale: 'ru' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('август 2026')).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: 'Предыдущий месяц' })
    ).toBeVisible()
  },
}
