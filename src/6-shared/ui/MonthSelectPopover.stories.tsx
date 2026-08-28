import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { List, ListItemButton, ListItemText } from '@mui/material'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import MonthSelectPopover from './MonthSelectPopover'
import { formatDate, toISOMonth } from '6-shared/helpers/date'
import type { TISOMonth } from '6-shared/types'

const meta = {
  title: 'UI/Month select',
  parameters: { layout: 'centered' },
} satisfies Meta
export default meta
type Story = StoryObj

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

export const BoundsAndKeyboard: Story = {
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

/** The old month cells, including ListItemText's margins. A menu row is
 * shorter, so reusing its spacing would silently shrink this calendar. */
function CellReference() {
  const now = new Date()
  const months = Array.from({ length: 12 }, (_, m) =>
    toISOMonth(new Date(now.getFullYear(), m))
  )
  return (
    <List className="grid grid-cols-3" data-testid="mui-months">
      {months.map(month => (
        <ListItemButton
          key={month}
          sx={{
            borderRadius: 1,
            border: theme =>
              month === toISOMonth(now)
                ? `1px solid ${theme.palette.primary.main}`
                : 'none',
          }}
          selected={month === toISOMonth(now)}
        >
          <ListItemText className="text-center">
            {formatDate(month, 'LLL').toUpperCase()}
          </ListItemText>
        </ListItemButton>
      ))}
    </List>
  )
}

export const CellParity: Story = {
  render: () => (
    <>
      <Harness disablePast />
      <div className="w-max">
        <CellReference />
      </div>
    </>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const snapshot = (el: HTMLElement) => {
      const s = getComputedStyle(el)
      const r = el.getBoundingClientRect()
      return {
        width: Math.round(r.width),
        height: Math.round(r.height),
        padding: s.padding,
        color: s.color,
        background: s.backgroundColor,
        border: s.border,
        radius: s.borderRadius,
      }
    }
    const current = formatDate(new Date(), 'LLL').toUpperCase()
    const reference = snapshot(
      within(canvas.getByTestId('mui-months')).getByRole('button', {
        name: current,
      })
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Choose month' }))
    const popup = await within(canvasElement.ownerDocument.body).findByRole(
      'dialog',
      { name: 'Select month' }
    )
    await waitFor(() =>
      expect(
        snapshot(within(popup).getByRole('button', { name: current }))
      ).toEqual(reference)
    )
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(popup).not.toBeVisible())
  },
}
export const DarkCellParity: Story = {
  ...CellParity,
  globals: { theme: 'dark' },
}
