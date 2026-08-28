import type { Meta, StoryObj } from '@storybook/react-vite'
import { List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material'
import { expect, within } from 'storybook/test'
import { AccountBalanceIcon } from '6-shared/ui/Icons'
import NavigationDrawer from './NavDrawer'
import { MobileNavigation } from './MobileNavigation'

const meta = {
  title: 'Navigation/Shell',
  parameters: {
    layout: 'fullscreen',
    app: { scenario: 'demo', globalWidgets: true },
  },
} satisfies Meta

export default meta
type Story = StoryObj

export const DesktopDrawer: Story = {
  render: () => (
    <div className="flex min-h-[720px] bg-background">
      <NavigationDrawer />
      <div className="grow" />
    </div>
  ),
}

export const MobileBottomNavigation: Story = {
  globals: { viewport: { value: 'iphone13' } },
  render: () => (
    <div className="flex min-h-[600px] flex-col bg-background">
      <MobileNavigation />
    </div>
  ),
}

/** The rows MUI drew, next to the ones that replaced them. A navigation link
 * was a `ListItemButton` with a `ListItemIcon` and a `ListItemText`, and the
 * owned row has to land on the same box — the panel's width is fixed, so a
 * row that grew would reflow the labels. */
function RowReference() {
  return (
    <List className="w-[264px]" data-testid="mui-links">
      <ListItemButton className="rounded-lg" selected>
        <ListItemIcon>
          <AccountBalanceIcon />
        </ListItemIcon>
        <ListItemText primary="Budget" />
      </ListItemButton>
    </List>
  )
}

export const RowParity: Story = {
  // On the budget route, so the row under test is the selected one — MUI
  // painted the open section and so does its replacement.
  parameters: {
    app: { scenario: 'demo', globalWidgets: true, route: '/budget' },
  },
  render: () => (
    <div className="flex min-h-[720px] bg-background">
      <NavigationDrawer />
      <div className="grow p-4">
        <RowReference />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const snapshot = (row: HTMLElement, label: HTMLElement) => {
      const box = row.getBoundingClientRect()
      const style = getComputedStyle(row)
      const labelStyle = getComputedStyle(label)
      return {
        height: Math.round(box.height),
        padding: style.padding,
        radius: style.borderRadius,
        display: style.display,
        background: style.backgroundColor,
        // Where the label starts inside the row is the icon gutter, which MUI
        // set on `ListItemIcon` and the owned row sets on `ListRowIcon`.
        labelOffset: Math.round(
          label.getBoundingClientRect().left -
            box.left -
            parseFloat(style.paddingLeft)
        ),
        font: labelStyle.font,
        color: labelStyle.color,
      }
    }
    const reference = within(canvas.getByTestId('mui-links')).getByRole(
      'button',
      { name: 'Budget' }
    )
    const owned = canvas.getByRole('link', { name: 'Budget' })
    await expect(snapshot(owned, within(owned).getByText('Budget'))).toEqual(
      snapshot(reference, within(reference).getByText('Budget'))
    )
    // The open section is announced, not just painted.
    await expect(owned).toHaveAttribute('aria-current', 'page')
  },
}

export const DarkRowParity: Story = {
  ...RowParity,
  globals: { theme: 'dark' },
}
