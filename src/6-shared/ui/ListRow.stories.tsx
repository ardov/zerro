import type { Meta, StoryObj } from '@storybook/react-vite'
import { ListRowSubheader, ListRows, listItemDenseClass } from './ListRow'

const meta = {
  title: 'Library/Display/ListRow',
  component: ListRows,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    children: <button className={listItemDenseClass}>Row label</button>,
  },
} satisfies Meta<typeof ListRows>
export default meta
type Story = StoryObj<typeof meta>

function ListPreview({ disablePadding }: { disablePadding?: boolean }) {
  return (
    <div className="w-[280px]">
      <ListRows disablePadding={disablePadding}>
        <ListRowSubheader sticky>Heading</ListRowSubheader>
        <button type="button" className={listItemDenseClass} data-selected="">
          <span className="my-1">Row label</span>
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
      <ListPreview disablePadding />
    </div>
  ),
}
