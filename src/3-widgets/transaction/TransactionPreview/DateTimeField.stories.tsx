import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test'
import type { TISODate } from '@/6-shared/types'
import { formatDateInput, getDateLocale } from '@/6-shared/helpers/date'
import { Button } from '@/6-shared/ui/kit/Button'
import { DateTimeField } from './DateTimeField'

function Example() {
  const [date, setDate] = useState<TISODate>('2026-09-12')
  const [time, setTime] = useState('18:56')
  return (
    <div className="grid w-full max-w-md gap-4 bg-ui-card p-4 text-ui-primary">
      <DateTimeField
        date={date}
        onDateChange={setDate}
        time={time}
        onTimeChange={setTime}
      />
      <output aria-label="Selected date and time">
        {date} {time}
      </output>
      <Button variant="secondary">Outside field</Button>
    </div>
  )
}

const meta = {
  title: 'App/Transactions/DateTimeField',
  component: Example,
  parameters: { layout: 'padded' },
  render: () => <Example />,
} satisfies Meta<typeof Example>
export default meta
type Story = StoryObj<typeof meta>

export const Editing: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const date = canvas.getByRole('textbox', { name: 'Date' })
    const time = canvas.getByLabelText('Time')
    const value = canvas.getByRole('status', { name: 'Selected date and time' })
    const outside = canvas.getByRole('button', { name: 'Outside field' })
    const shown = (value: TISODate) => formatDateInput(value, getDateLocale())

    await userEvent.clear(date)
    await userEvent.type(date, '99/99/2026')
    await expect(date).toHaveAttribute('aria-invalid', 'true')
    await expect(value).toHaveTextContent('2026-09-12 18:56')
    await userEvent.click(outside)
    await expect(date).toHaveValue(shown('2026-09-12'))
    await expect(date).not.toHaveAttribute('aria-invalid')

    await userEvent.clear(date)
    await userEvent.click(outside)
    await expect(date).toHaveValue(shown('2026-09-12'))

    await userEvent.clear(date)
    await userEvent.type(date, shown('2026-09-15'))
    await userEvent.click(outside)
    await expect(value).toHaveTextContent('2026-09-15 18:56')
    await expect(time).toHaveAttribute('type', 'time')
    fireEvent.change(time, { target: { value: '09:30' } })
    await expect(value).toHaveTextContent('2026-09-15 09:30')
  },
}

export const CalendarSelection: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole('button', { name: 'Select date' })
    await userEvent.click(trigger)
    const dialog = await body.findByRole('dialog', { name: 'Select date' })
    await userEvent.click(
      within(dialog).getByRole('button', { name: /16 September 2026/ })
    )
    await expect(
      canvas.getByRole('status', { name: 'Selected date and time' })
    ).toHaveTextContent('2026-09-16 18:56')
    await waitFor(() => expect(dialog).not.toBeInTheDocument())
    await expect(trigger).toHaveFocus()

    await userEvent.click(trigger)
    await body.findByRole('dialog', { name: 'Select date' })
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
    await expect(trigger).toHaveFocus()
  },
}

export const MobileCalendar: Story = {
  ...CalendarSelection,
  globals: { viewport: { value: 'mobile1' } },
}
