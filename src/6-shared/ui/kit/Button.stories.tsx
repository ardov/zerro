import type { Meta, StoryObj } from '@storybook/react-vite'
import { AddIcon, ArrowForwardIcon } from '@/6-shared/ui/Icons'
import { Button, buttonOptions } from './Button'

const variants = buttonOptions.variant
const sizes = buttonOptions.size.filter(size => !size.startsWith('icon'))
const iconSizes = buttonOptions.size.filter(size => size.startsWith('icon'))

const meta = {
  title: 'UI Kit/Button',
  component: Button,
  parameters: { layout: 'fullscreen' },
  args: {
    children: 'Save changes',
    variant: 'primary',
    size: 'lg',
    disabled: false,
  },
  argTypes: {
    variant: { control: 'select', options: variants },
    size: { control: 'select', options: buttonOptions.size },
  },
  decorators: [
    Story => (
      <main className="min-h-screen bg-ui-base p-6 font-sans text-ui-14 text-ui-primary">
        <div className="mx-auto max-w-3xl rounded-ui-card bg-ui-card p-6 shadow-ui-card">
          <Story />
        </div>
      </main>
    ),
  ],
} satisfies Meta<typeof Button>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Showcase: Story = {
  render: () => (
    <div className="grid gap-8">
      <section className="grid gap-4">
        {variants.map(variant => (
          <div key={variant} className="flex flex-wrap items-center gap-3">
            <span className="w-24 text-ui-secondary">{variant}</span>
            <Button variant={variant}>Save changes</Button>
            <Button variant={variant}>
              <AddIcon size={20} data-icon="inline-start" />
              Add item
            </Button>
            <Button variant={variant} disabled>
              Save changes
            </Button>
          </div>
        ))}
      </section>
      <section className="grid gap-4">
        <h2 className="m-0 text-ui-16 font-medium">Sizes</h2>
        <div className="flex flex-wrap items-end gap-6">
          {sizes.map(size => (
            <div key={size} className="grid justify-items-start gap-2">
              <span className="text-ui-secondary">{size}</span>
              <Button size={size}>
                Continue
                <ArrowForwardIcon data-icon="inline-end" />
              </Button>
            </div>
          ))}
        </div>
      </section>
      <section className="grid gap-4">
        <h2 className="m-0 text-ui-16 font-medium">Only icon</h2>
        <div className="flex flex-wrap items-end gap-6">
          {iconSizes.map(size => (
            <div key={size} className="grid justify-items-start gap-2">
              <span className="text-ui-secondary">{size}</span>
              <Button size={size} aria-label="Add item">
                <AddIcon />
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  ),
}
