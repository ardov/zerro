import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  List,
  ListItemButton,
  ListItemText,
  ListSubheader,
} from '@mui/material'
import { expect, within } from 'storybook/test'
import {
  ListRowSubheader,
  ListRowText,
  ListRows,
  listItemClass,
  listItemDenseClass,
} from './ListRow'

const meta = {
  title: 'UI/List rows',
  parameters: { layout: 'padded' },
} satisfies Meta
export default meta
type Story = StoryObj

/** The three boxes MUI drew for a list, side by side with the owned ones.
 * Each pair sits in its own column so neither can borrow the other's width. */
function Pair({ dense }: { dense?: boolean }) {
  const rowClass = dense ? listItemDenseClass : listItemClass
  return (
    <div className="flex gap-8">
      <div className="w-[280px]" data-testid="owned">
        <ListRows>
          {/* Not dense even in a dense list: MUI's subheader does not take
              `dense` from the list around it. */}
          <ListRowSubheader sticky>Heading</ListRowSubheader>
          <button type="button" className={rowClass} data-selected="">
            <ListRowText className="my-1">Row label</ListRowText>
          </button>
        </ListRows>
      </div>

      <div className="w-[280px]" data-testid="mui">
        <List dense={dense}>
          <ListSubheader>Heading</ListSubheader>
          <ListItemButton selected>
            <ListItemText primary="Row label" />
          </ListItemButton>
        </List>
      </div>
    </div>
  )
}

const metrics = (el: HTMLElement) => {
  const rect = el.getBoundingClientRect()
  const style = getComputedStyle(el)
  return {
    height: Math.round(rect.height),
    width: Math.round(rect.width),
    padding: style.padding,
    margin: style.margin,
    position: style.position,
    listStyleType: style.listStyleType,
  }
}

const box = (el: HTMLElement) => {
  const style = getComputedStyle(el)
  return {
    ...metrics(el),
    background: style.backgroundColor,
    color: style.color,
    font: style.font,
  }
}

/** Smallest piece first: a container that is 8px out says nothing about which
 * of the boxes inside it moved. */
const compare: Story['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const owned = canvas.getByTestId('owned')
  const mui = canvas.getByTestId('mui')

  // The label. MUI splits it in two — the margin sits on `ListItemText`'s
  // root and the type on its `primary` span — where the owned row has one
  // element doing both jobs.
  const ownedRow = within(owned).getByRole('button', { name: 'Row label' })
  const muiRow = within(mui).getByRole('button', { name: 'Row label' })
  const ownedLabel = ownedRow.querySelector<HTMLElement>(
    '[data-slot="list-row-text"]'
  )!
  const muiLabel = muiRow.querySelector<HTMLElement>('.MuiListItemText-root')!
  // Geometry against the root, type against the span. MUI's root carries a
  // `body1` font it never paints with, so comparing that would be comparing
  // an element that has no text of its own.
  await expect(metrics(ownedLabel)).toEqual(metrics(muiLabel))
  await expect(getComputedStyle(ownedLabel).font).toBe(
    getComputedStyle(
      muiRow.querySelector<HTMLElement>('.MuiListItemText-primary')!
    ).font
  )

  // The row it sits in, selected. Its own font is left out: MUI's `dense` is
  // a context that reaches the label and leaves `body1` declared on the row,
  // where the owned class puts the smaller type on the row and lets it
  // cascade. Nothing paints with the row's own font — every dense call site
  // that had bare text in a row was already asking for `type-body-sm` on it.
  const paint = (el: HTMLElement) => {
    const style = getComputedStyle(el)
    return {
      ...metrics(el),
      background: style.backgroundColor,
      color: style.color,
    }
  }
  await expect(paint(ownedRow)).toEqual(paint(muiRow))

  // The heading, which sticks to the top of whatever scrolls it.
  await expect(box(within(owned).getByText('Heading'))).toEqual(
    box(within(mui).getByText('Heading'))
  )

  // And only then the container.
  await expect(
    box(owned.querySelector<HTMLElement>('[data-slot="list-rows"]')!)
  ).toEqual(box(mui.querySelector('ul')!))
}

export const Regular: Story = { render: () => <Pair />, play: compare }
export const Dense: Story = { render: () => <Pair dense />, play: compare }
export const DarkDense: Story = { ...Dense, globals: { theme: 'dark' } }

/** `disablePadding` takes the container's 8px away, the way MUI's does. */
export const NoPadding: Story = {
  render: () => (
    <div className="flex gap-8">
      <div className="w-[280px]" data-testid="owned">
        <ListRows disablePadding />
      </div>
      <div className="w-[280px]" data-testid="mui">
        <List disablePadding />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      getComputedStyle(
        canvas
          .getByTestId('owned')
          .querySelector<HTMLElement>('[data-slot="list-rows"]')!
      ).padding
    ).toBe(
      getComputedStyle(canvas.getByTestId('mui').querySelector('ul')!).padding
    )
  },
}
