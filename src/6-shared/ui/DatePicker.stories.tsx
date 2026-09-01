import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import type { TISODate } from '@/6-shared/types'
import { DatePicker } from './DatePicker'

const meta = {
  title: 'Library/Input/DatePicker',
  component: DatePicker,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    fullWidth: true,
    label: 'Date',
    onChange: () => {},
    value: '2026-08-15',
  },
} satisfies Meta<typeof DatePicker>
export default meta
type Story = StoryObj<typeof meta>

/** One component instance, entirely controlled by the Args panel. */
export const Bench: Story = {}

function Harness() {
  const [value, setValue] = useState<TISODate>('2026-08-15')
  return (
    <div className="w-64">
      <output data-testid="selected-date">{value}</output>
      <DatePicker label="Date" value={value} onChange={setValue} fullWidth />
    </div>
  )
}

export const Typing: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const field = canvas.getByLabelText('Date')
    await expect(field).toHaveValue('15/08/2026')

    // Half a date is not a date the field can report, so it keeps the last
    // whole one and says the text is not one.
    await userEvent.clear(field)
    await userEvent.type(field, '3/9')
    await expect(field).toHaveAttribute('aria-invalid', 'true')
    await expect(canvas.getByTestId('selected-date')).toHaveTextContent(
      '2026-08-15'
    )

    // Looser than the pattern it prints: single digits and a two-digit year.
    await userEvent.type(field, '/27')
    await expect(canvas.getByTestId('selected-date')).toHaveTextContent(
      '2027-09-03'
    )
    // ...and what it prints back is the pattern.
    await userEvent.tab()
    await expect(field).toHaveValue('03/09/2027')
  },
}

export const ImpossibleDate: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const field = canvas.getByLabelText('Date')
    await userEvent.clear(field)
    // The 31st of a 30-day month is not the 1st of the next one.
    await userEvent.type(field, '31/09/2026')
    await expect(field).toHaveAttribute('aria-invalid', 'true')
    await expect(canvas.getByTestId('selected-date')).toHaveTextContent(
      '2026-08-15'
    )
    await userEvent.tab()
    await expect(field).toHaveValue('15/08/2026')
  },
}

/** A year is typed one digit at a time, and `202` is a state on the way to
 * `2026`. It is not a year: `toISODate` writes years unpadded, so reporting
 * it would hand the field back `202-08-15`, which `parseISO` reads as an
 * invalid date and `format` throws on — leaving the field was where it threw. */
export const HalfTypedYear: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const field = canvas.getByLabelText('Date')

    // An empty field is not yet wrong — nothing is being claimed by it.
    await userEvent.clear(field)
    await expect(field).not.toHaveAttribute('aria-invalid', 'true')

    await userEvent.type(field, '15/08/202')
    await expect(field).toHaveAttribute('aria-invalid', 'true')
    // A field that has gone red says why.
    await expect(canvas.getByText('Not a date')).toBeVisible()
    // The last whole date, which is the keystroke before this one: `20` is a
    // year and 2020 is a date, so that is what the field is still holding.
    await expect(canvas.getByTestId('selected-date')).toHaveTextContent(
      '2020-08-15'
    )

    // The keystroke that finishes the year is the one that reports it.
    await userEvent.type(field, '6')
    await expect(field).not.toHaveAttribute('aria-invalid', 'true')
    await expect(canvas.getByTestId('selected-date')).toHaveTextContent(
      '2026-08-15'
    )
    await userEvent.tab()
    await expect(field).toHaveValue('15/08/2026')
  },
}

/** Two digits are a whole year, and which century they mean is the split
 * `strftime` uses: a ledger holds old records and few distant plans. */
export const TwoDigitYear: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const field = canvas.getByLabelText('Date')
    await userEvent.clear(field)
    await userEvent.type(field, '15/08/99')
    await expect(canvas.getByTestId('selected-date')).toHaveTextContent(
      '1999-08-15'
    )
    await userEvent.tab()
    await expect(field).toHaveValue('15/08/1999')
  },
}

export const PickingFromTheCalendar: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Select date' }))
    const popup = await body.findByRole('dialog', { name: 'Select date' })
    const day = popup.querySelector<HTMLButtonElement>(
      '[data-day="2026-08-27"] button'
    )
    await userEvent.click(day!)
    await waitFor(() => expect(popup).not.toBeVisible())
    await expect(canvas.getByTestId('selected-date')).toHaveTextContent(
      '2026-08-27'
    )
    await expect(canvas.getByLabelText('Date')).toHaveValue('27/08/2026')
  },
}
