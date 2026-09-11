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

/** A delete-only chip exposes a named button with keyboard deletion. */
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
    const action = within(chip).getByRole('button')
    action.focus()
    await expect(action).toHaveFocus()
    await userEvent.keyboard('{Delete}')
    await expect(canvas.getByText('Removed')).toBeInTheDocument()
  },
}

export const SingleTabStop: Story = {
  render: function Render() {
    const [edited, setEdited] = useState(0)
    const [deleted, setDeleted] = useState(0)
    return (
      <>
        <button>Before</button>
        <Chip
          label="Editable"
          onClick={() => setEdited(n => n + 1)}
          onDelete={() => setDeleted(n => n + 1)}
        />
        <button>After</button>
        <output>
          {edited}/{deleted}
        </output>
      </>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    canvas.getByRole('button', { name: 'Before' }).focus()
    await userEvent.tab()
    const edit = canvas.getByRole('button', { name: 'Editable' })
    await expect(edit).toHaveFocus()
    const chip = edit.closest<HTMLElement>('[data-slot="chip"]')!
    await expect(getComputedStyle(chip).outlineStyle).toBe('solid')
    await userEvent.keyboard('{Enter}')
    await expect(canvas.getByText('1/0')).toBeInTheDocument()
    await userEvent.keyboard('{Delete}')
    await expect(canvas.getByText('1/1')).toBeInTheDocument()
    await userEvent.tab()
    await expect(canvas.getByRole('button', { name: 'After' })).toHaveFocus()
    await userEvent.click(
      canvas.getByRole('button', { name: 'Remove Editable' })
    )
    await expect(canvas.getByText('1/2')).toBeInTheDocument()
  },
}
