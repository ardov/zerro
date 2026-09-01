import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import MonthSelectPopover from './MonthSelectPopover'
import { formatDate, toISOMonth } from '@/6-shared/helpers/date'
import type { TISOMonth } from '@/6-shared/types'

const meta = {
  title: 'Library/Input/MonthSelect',
  component: MonthSelectPopover,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    disablePast: false,
    onChange: () => {},
    onClose: () => {},
    open: false,
    value: '2030-06',
  },
} satisfies Meta<typeof MonthSelectPopover>
export default meta
type Story = StoryObj<typeof meta>

function Harness({ disablePast = false }: { disablePast?: boolean }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [value, setValue] = useState<TISOMonth>(
    disablePast ? toISOMonth(new Date()) : '2030-06'
  )
  return (
    <>
      <button onClick={e => setAnchor(e.currentTarget)}>Choose month</button>
      <output data-testid="selected-month">{value}</output>
      <MonthSelectPopover
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        value={value}
        minMonth={disablePast ? undefined : '2030-03'}
        maxMonth={disablePast ? undefined : '2031-04'}
        disablePast={disablePast}
        onChange={month => {
          setValue(month)
          setAnchor(null)
        }}
      />
    </>
  )
}

/** One component instance, with its visual props supplied by Args. */
export const Bench: Story = {
  render: args => <Harness disablePast={args.disablePast} />,
}

export const BoundsAndKeyboard: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole('button', { name: 'Choose month' })
    await userEvent.click(trigger)
    const popup = await body.findByRole('dialog', { name: 'Select month' })
    const inside = within(popup)
    await expect(inside.getByRole('button', { name: 'JAN' })).toBeDisabled()
    await expect(inside.getByRole('button', { name: 'FEB' })).toBeDisabled()
    await expect(inside.getByRole('button', { name: 'MAR' })).toBeEnabled()
    await expect(inside.getByRole('button', { name: 'JUN' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    await expect(
      inside.getByRole('button', { name: 'Previous year' })
    ).toBeDisabled()
    await userEvent.click(inside.getByRole('button', { name: 'Next year' }))
    await expect(
      inside.getByRole('button', { name: 'Next year' })
    ).toBeDisabled()
    await expect(inside.getByRole('button', { name: 'MAY' })).toBeDisabled()
    const april = inside.getByRole('button', { name: 'APR' })
    april.focus()
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(popup).not.toBeVisible())
    await expect(canvas.getByTestId('selected-month')).toHaveTextContent(
      '2031-04'
    )
    await waitFor(() => expect(trigger).toHaveFocus())
  },
}

export const PastMonths: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <Harness disablePast />,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Choose month' })
    )
    const popup = await body.findByRole('dialog', { name: 'Select month' })
    const today = new Date()
    for (let m = 0; m < 12; m++) {
      const button = within(popup).getByRole('button', {
        name: formatDate(new Date(today.getFullYear(), m), 'LLL').toUpperCase(),
      })
      if (m < today.getMonth()) await expect(button).toBeDisabled()
      else await expect(button).toBeEnabled()
    }
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(popup).not.toBeVisible())
  },
}
