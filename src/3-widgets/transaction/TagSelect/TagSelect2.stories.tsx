import type { Meta, StoryObj } from '@storybook/react-vite'
import { List, ListItemButton, ListItemText } from '@mui/material'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { TagIcon } from '6-shared/ui/TagIcon'
import { TagSelect2 } from './TagSelect2'

const meta = {
  title: 'Transactions/Tag select',
  parameters: { layout: 'centered', app: { scenario: 'demo' } },
} satisfies Meta
export default meta
type Story = StoryObj

/** The row MUI drew. A tag was a `ListItemButton` holding the icon and a
 * `ListItemText`, and the icon carried its own margins rather than sitting in
 * a `ListItemIcon`. */
function RowReference({ name, symbol }: { name: string; symbol: string }) {
  return (
    <List className="w-[280px]" data-testid="mui-rows">
      <ListItemButton selected>
        <TagIcon symbol={symbol} className="mr-4 ml-0" />
        <ListItemText primary={name} />
      </ListItemButton>
    </List>
  )
}

const snapshot = (row: HTMLElement, label: HTMLElement) => {
  const box = row.getBoundingClientRect()
  const style = getComputedStyle(row)
  const labelStyle = getComputedStyle(label)
  return {
    height: Math.round(box.height),
    padding: style.padding,
    background: style.backgroundColor,
    // Where the label starts is the icon's gutter, which the row does not own.
    labelOffset: Math.round(
      label.getBoundingClientRect().left -
        box.left -
        parseFloat(style.paddingLeft)
    ),
    font: labelStyle.font,
    color: labelStyle.color,
  }
}

/** The first tag is highlighted the moment the list opens, so the row under
 * test is the selected one in both. */
export const RowParity: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <TagSelect2 onChange={() => {}} />
      <RowReference name="Food" symbol="🍔" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const reference = within(canvas.getByTestId('mui-rows')).getByRole('button')
    await userEvent.click(canvas.getAllByRole('button')[0])
    const popup = await body.findByRole('dialog', {
      name: 'Select category',
    })
    const rows = within(popup).getAllByRole('button')
    const owned = rows.find(row => row.hasAttribute('data-selected'))!
    const label = (row: HTMLElement) =>
      row.querySelector<HTMLElement>(
        '[data-slot="list-row-text"], .MuiListItemText-primary'
      )!
    await waitFor(() =>
      expect(snapshot(owned, label(owned))).toEqual(
        snapshot(reference, label(reference))
      )
    )
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(popup).not.toBeVisible())
  },
}

export const DarkRowParity: Story = {
  ...RowParity,
  globals: { theme: 'dark' },
}
