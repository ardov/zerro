import type { Meta, StoryObj } from '@storybook/react-vite'
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

export const Regular: Story = { render: () => <ListPreview /> }
export const Dense: Story = { render: () => <ListPreview dense /> }
export const DarkDense: Story = { ...Dense, globals: { theme: 'dark' } }

export const NoPadding: Story = {
  render: () => <ListPreview disablePadding />,
}
