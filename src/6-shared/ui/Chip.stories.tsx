import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { Chip } from './Chip'

const meta = {
  title: 'Library/Display/Chip',
  component: Chip,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { label: 'Category' },
} satisfies Meta<typeof Chip>
export default meta
type Story = StoryObj<typeof meta>

/** One component instance, entirely controlled by the Args panel. */
export const Bench: Story = {}

type Variant = {
  name: string
  size?: 'small'
  variant?: 'outlined'
  color?: 'primary'
  deletable?: boolean
}

/** Every shape the app asks a chip for. */
const variants: Variant[] = [
  { name: 'Filled' },
  { name: 'Filled small', size: 'small' },
  { name: 'Outlined', variant: 'outlined' },
  { name: 'Outlined small', size: 'small', variant: 'outlined' },
  { name: 'Primary outlined', variant: 'outlined', color: 'primary' },
  { name: 'Deletable', deletable: true },
  { name: 'Deletable small', size: 'small', deletable: true },
  { name: 'Deletable outlined', variant: 'outlined', deletable: true },
]

function VariantShowcase() {
  return (
    <div className="flex flex-col items-start gap-2">
      {variants.map(v => (
        <Chip
          key={v.name}
          label={v.name}
          size={v.size}
          variant={v.variant}
          color={v.color}
          onDelete={v.deletable ? () => {} : undefined}
        />
      ))}
    </div>
  )
}

export const Showcase: Story = {
  tags: ['!test'],
  render: () => <VariantShowcase />,
}

/** A deletable chip is focusable without pretending that it is a button. */
export const KeyboardDelete: Story = {
  tags: ['!dev', '!autodocs'],
  render: function Render() {
    const [present, setPresent] = useState(true)
    return present ? (
      <Chip label="Category" onDelete={() => setPresent(false)} />
    ) : (
      <span>Removed</span>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const chip = canvas
      .getByText('Category')
      .closest<HTMLElement>('[data-slot="chip"]')!
    await expect(chip).not.toHaveAttribute('role')
    chip.focus()
    await expect(chip).toHaveFocus()
    await userEvent.keyboard('{Delete}')
    await expect(canvas.getByText('Removed')).toBeInTheDocument()
  },
}
