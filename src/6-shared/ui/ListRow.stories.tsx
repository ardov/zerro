import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import {
  ListRowIcon,
  ListRowSubheader,
  ListRowText,
  ListRows,
  listRowClass,
  listItemClass,
  listItemDenseClass,
} from './ListRow'
import { AddIcon } from './Icons'

const meta = {
  title: 'Library/Display/ListRow',
  component: ListRows,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    children: <button className={listItemClass}>Row label</button>,
  },
} satisfies Meta<typeof ListRows>
export default meta
type Story = StoryObj<typeof meta>

function ListPreview({
  dense,
  disablePadding,
}: {
  dense?: boolean
  disablePadding?: boolean
}) {
  const rowClass = dense ? listItemDenseClass : listItemClass
  return (
    <div className="w-[280px]">
      <ListRows disablePadding={disablePadding}>
        <ListRowSubheader sticky>Heading</ListRowSubheader>
        <button type="button" className={rowClass} data-selected="">
          <ListRowText className="my-1">Row label</ListRowText>
        </button>
      </ListRows>
    </div>
  )
}

/** One component instance, entirely controlled by the Args panel. */
export const Bench: Story = {}

export const Showcase: Story = {
  tags: ['!test'],
  render: () => (
    <div className="flex flex-col gap-4">
      <ListPreview />
      <ListPreview dense />
      <ListPreview disablePadding />
    </div>
  ),
}

/** Leading content occupies one 48px square. Without it, text keeps 16px. */
export const AlignmentCheck: Story = {
  tags: ['!autodocs'],
  render: () => (
    <div className="w-[280px]">
      <button type="button" className={listRowClass}>
        <ListRowIcon>
          <AddIcon />
        </ListRowIcon>
        <ListRowText>With icon</ListRowText>
      </button>
      <button type="button" className={listRowClass}>
        <ListRowText>Without icon</ListRowText>
      </button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const withIcon = canvas.getByRole('button', { name: 'With icon' })
    const withoutIcon = canvas.getByRole('button', { name: 'Without icon' })
    const icon = withIcon.querySelector('[data-slot="list-row-icon"]')!
    const withText = within(withIcon).getByText('With icon')
    const withoutText = within(withoutIcon).getByText('Without icon')

    const offset = (element: Element, row: Element) =>
      element.getBoundingClientRect().left - row.getBoundingClientRect().left
    const centre = (element: Element, row: Element) => {
      const box = element.getBoundingClientRect()
      return box.left + box.width / 2 - row.getBoundingClientRect().left
    }

    expect(offset(withText, withIcon)).toBeCloseTo(48, 1)
    expect(centre(icon, withIcon)).toBeCloseTo(24, 1)
    expect(withIcon.getBoundingClientRect().height).toBeCloseTo(48, 1)
    expect(icon.getBoundingClientRect().height).toBeCloseTo(48, 1)
    expect(offset(withoutText, withoutIcon)).toBeCloseTo(16, 1)
  },
}
