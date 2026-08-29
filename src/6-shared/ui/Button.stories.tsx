import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button, IconButton, buttonPalettes } from './Button'
import { AddIcon } from './Icons'

const meta = { title: 'UI/Button' } satisfies Meta

export default meta
type Story = StoryObj

/** Every implemented pair, at every size, read off the component's own table. */
const cases = Object.entries(buttonPalettes).flatMap(([variant, colors]) =>
  Object.keys(colors).flatMap(color =>
    (['small', 'medium', 'large'] as const).map(size => ({
      variant,
      color,
      size,
    }))
  )
)

const iconCases = [
  { color: 'default', size: 'medium', edge: undefined },
  { color: 'default', size: 'small', edge: undefined },
  { color: 'inherit', size: 'small', edge: undefined },
  { color: 'primary', size: 'small', edge: undefined },
  { color: 'default', size: 'medium', edge: 'end' },
] as const

const id = (c: { variant?: string; color: string; size: string }) =>
  `${c.variant || 'icon'}-${c.color}-${c.size}`

function Variants() {
  return (
    <div className="flex flex-col gap-4 text-info">
      {cases.map(c => (
        <div key={id(c)} className="flex items-center gap-4">
          <Button {...(c as any)} startIcon={<AddIcon />}>
            Label
          </Button>
        </div>
      ))}
      {iconCases.map(c => (
        <div key={id(c) + c.edge} className="flex items-center gap-4">
          <IconButton color={c.color} size={c.size} edge={c.edge}>
            <AddIcon />
          </IconButton>
        </div>
      ))}
      <div className="flex items-center gap-4">
        <Button variant="contained" disabled>
          Label
        </Button>
      </div>
    </div>
  )
}

export const Showcase: Story = { render: () => <Variants /> }

export const DarkShowcase: Story = {
  ...Showcase,
  globals: { theme: 'dark' },
}
