import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button, buttonPalettes } from './Button'
import { AddIcon } from './Icons'

const meta = {
  title: 'Library/Input/Button',
  component: Button,
  tags: ['autodocs'],
  args: {
    children: 'Label',
    color: 'primary',
    size: 'medium',
    variant: 'contained',
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

/** One component instance, entirely controlled by the Args panel. */
export const Bench: Story = {}

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

const id = (c: { variant?: string; color: string; size: string }) =>
  `${c.variant}-${c.color}-${c.size}`

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
      <div className="flex items-center gap-4">
        <Button variant="contained" disabled>
          Label
        </Button>
      </div>
    </div>
  )
}

export const Showcase: Story = {
  tags: ['!test'],
  render: () => <Variants />,
}
