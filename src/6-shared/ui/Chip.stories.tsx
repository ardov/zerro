import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Chip as MuiChip } from '@mui/material'
import { expect, userEvent, within } from 'storybook/test'
import { Chip } from './Chip'

const meta = {
  title: 'UI/Chip',
  parameters: { layout: 'padded' },
} satisfies Meta
export default meta
type Story = StoryObj

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

function Pair() {
  return (
    <div className="flex gap-8">
      <div className="flex flex-col items-start gap-2" data-testid="owned">
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
      <div className="flex flex-col items-start gap-2" data-testid="mui">
        {variants.map(v => (
          <MuiChip
            key={v.name}
            label={v.name}
            size={v.size}
            variant={v.variant}
            color={v.color}
            onDelete={v.deletable ? () => {} : undefined}
          />
        ))}
      </div>
    </div>
  )
}

const box = (el: HTMLElement) => {
  const rect = el.getBoundingClientRect()
  const style = getComputedStyle(el)
  return {
    height: Math.round(rect.height),
    width: Math.round(rect.width),
    radius: style.borderRadius,
    background: style.backgroundColor,
    color: style.color,
    border: style.border,
    font: style.font,
  }
}

const compare: Story['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const owned = within(canvas.getByTestId('owned'))
  const mui = within(canvas.getByTestId('mui'))
  for (const v of variants) {
    const ownedChip = owned
      .getByText(v.name)
      .closest<HTMLElement>('[data-slot="chip"]')!
    const muiChip = mui.getByText(v.name).closest<HTMLElement>('.MuiChip-root')!
    // The label first: it carries the padding, so a chip that is out by a few
    // pixels is usually its label that is.
    const label = (chip: HTMLElement) =>
      chip.querySelector<HTMLElement>(
        '[data-slot="chip-label"], .MuiChip-label'
      )!
    await expect({ [`${v.name} label`]: box(label(ownedChip)) }).toEqual({
      [`${v.name} label`]: box(label(muiChip)),
    })
    await expect({ [v.name]: box(ownedChip) }).toEqual({
      [v.name]: box(muiChip),
    })
  }
}

export const Parity: Story = { render: () => <Pair />, play: compare }
export const DarkParity: Story = { ...Parity, globals: { theme: 'dark' } }

/** MUI makes a deletable chip one keyboard target: Delete and Backspace invoke
 * the same action as its trailing cross. */
export const KeyboardDelete: Story = {
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
    const chip = canvas.getByRole('button', { name: 'Category' })
    chip.focus()
    await userEvent.keyboard('{Delete}')
    await expect(canvas.getByText('Removed')).toBeInTheDocument()
  },
}
