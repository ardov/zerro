import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { CalendarIcon } from '@/6-shared/ui/Icons'
import { Chip } from './Chip'

const meta = {
  title: 'UI Kit/Chip',
  component: Chip,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Compact category labels and filters. Use children for the label and start for a decorative icon. color accepts an opaque HEX, RGB or OKLCH fill; outline variants ignore it. onClick opens or edits, onRemove removes. Interactive chips have one Tab stop; Delete/Backspace removes. className/style decorate the surface; native attributes and ref target the primary button (the label span when static). The caller restores focus after removing a chip. Example: <Chip onRemove={remove}>Groceries</Chip>.',
      },
    },
  },
  args: { children: 'Groceries' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['filled', 'outline', 'outline-draft'],
    },
    color: { control: 'color' },
  },
} satisfies Meta<typeof Chip>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const Showcase: Story = {
  render: () => (
    <div className="flex max-w-xl flex-col gap-6 p-8">
      {(['filled', 'outline', 'outline-draft'] as const).map(variant => (
        <div key={variant} className="flex flex-wrap gap-3">
          <Chip variant={variant}>Groceries</Chip>
          <Chip variant={variant} start={<CalendarIcon />} onClick={fn()}>
            Category
          </Chip>
          <Chip variant={variant} onRemove={fn()}>
            Selected
          </Chip>
          <Chip
            variant={variant}
            start={<CalendarIcon />}
            onClick={fn()}
            onRemove={fn()}
          >
            Filter
          </Chip>
          <Chip variant={variant} onClick={fn()} onRemove={fn()} disabled>
            Disabled
          </Chip>
        </div>
      ))}
      <div className="flex flex-wrap gap-3">
        {['#f5dd72', '#172554', '#de6474', 'oklch(0.600 0.150 150)'].map(
          color => (
            <Chip
              key={color}
              color={color}
              start={<CalendarIcon />}
              onClick={fn()}
              onRemove={fn()}
            >
              Groceries
            </Chip>
          )
        )}
      </div>
      <Chip
        className="max-w-48"
        start={<CalendarIcon />}
        onClick={fn()}
        onRemove={fn()}
      >
        A long category name that does not fit
      </Chip>
    </div>
  ),
}
export const Interaction: Story = {
  args: { onClick: fn(), onRemove: fn() },
  render: args => (
    <div className="flex gap-3">
      <Chip {...args} />
      <button type="button">Next</button>
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const primary = canvas.getByRole('button', {
      name: 'Groceries',
    })
    primary.focus()
    await userEvent.keyboard('{Enter}')
    await expect(args.onClick).toHaveBeenCalledTimes(1)
    await userEvent.keyboard('{Delete}')
    await expect(args.onRemove).toHaveBeenCalledTimes(1)
    await userEvent.tab()
    await expect(canvas.getByRole('button', { name: 'Next' })).toHaveFocus()
    await userEvent.click(canvas.getAllByRole('button')[1])
    await expect(args.onRemove).toHaveBeenCalledTimes(2)
    await expect(args.onClick).toHaveBeenCalledTimes(1)
  },
}
