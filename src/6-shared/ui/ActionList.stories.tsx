import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import {
  Divider as MuiDivider,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  MenuItem,
  MenuList,
} from '@mui/material'
import { ActionList, ActionListItem } from './ActionList'
import { Divider } from './Divider'
import { ListRowIcon, ListRowSubheader, ListRowText } from './ListRow'
import { AddIcon } from './Icons'

const meta = { title: 'UI/Action list' } satisfies Meta

export default meta
type Story = StoryObj

/** The shapes `SettingsMenu` is built from: a plain row, a row with a trailing
 * control, and a row whose label wraps onto a second line. */
function Matrix() {
  return (
    <div className="flex items-start gap-8">
      <div data-testid="mui" className="w-[320px] bg-card">
        <MenuList>
          <ListSubheader>Section</ListSubheader>
          <MenuItem>
            <ListItemIcon>
              <AddIcon />
            </ListItemIcon>
            <ListItemText>Plain row</ListItemText>
          </MenuItem>
          <MuiDivider className="opacity-60" />
          <MenuItem>
            <ListItemIcon>
              <AddIcon />
            </ListItemIcon>
            <ListItemText
              className="whitespace-normal"
              primary="With description"
              secondary="A second line of explanation"
            />
          </MenuItem>
        </MenuList>
      </div>

      <div data-testid="owned" className="w-[320px] bg-card">
        <ActionList aria-label="Owned">
          <ListRowSubheader>Section</ListRowSubheader>
          <ActionListItem>
            <ListRowIcon>
              <AddIcon />
            </ListRowIcon>
            <ListRowText>Plain row</ListRowText>
          </ActionListItem>
          <Divider className="opacity-60" />
          <ActionListItem>
            <ListRowIcon>
              <AddIcon />
            </ListRowIcon>
            <ListRowText
              className="whitespace-normal"
              secondary="A second line of explanation"
            >
              With description
            </ListRowText>
          </ActionListItem>
        </ActionList>
      </div>
    </div>
  )
}

const box = (el: Element) => {
  const s = getComputedStyle(el)
  const rect = el.getBoundingClientRect()
  return {
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    padding: s.padding,
    fontSize: s.fontSize,
    lineHeight: s.lineHeight,
    fontWeight: s.fontWeight,
    color: s.color,
    minWidth: s.minWidth,
  }
}

const compare: Story['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const owned = canvas.getByTestId('owned')
  const legacy = canvas.getByTestId('mui')

  const all = (root: HTMLElement, selector: string) =>
    Array.from(root.querySelectorAll(selector)).map(box)

  // MUI renders rows as `li`, the toolbar renders them as `button`, so each
  // side is addressed by its own selector and the lists are compared in order.
  await expect(all(owned, '[data-slot="action-list-item"]')).toEqual(
    all(legacy, '.MuiMenuItem-root')
  )
  // The icon slot decides where every label starts.
  await expect(
    all(owned, '[data-slot="action-list-item"] > span:first-child')
  ).toEqual(all(legacy, '.MuiListItemIcon-root'))
  await expect(all(owned, '[data-slot="list-row-subheader"]')).toEqual(
    all(legacy, '.MuiListSubheader-root')
  )
  await expect(all(owned, 'hr')).toEqual(all(legacy, 'hr'))
}

export const Parity: Story = { render: () => <Matrix />, play: compare }

export const DarkParity: Story = { ...Parity, globals: { theme: 'dark' } }
