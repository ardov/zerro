import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  ListRowSubheader,
  ListRowText,
  ListRows,
  listItemClass,
  listItemDenseClass,
} from './ListRow'

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
