import { expect, userEvent, waitFor, within } from 'storybook/test'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { AddIcon, ArrowForwardIcon } from '@/6-shared/ui/Icons'
import { Button, IconButton, buttonOptions } from './Button'

const variants = buttonOptions.variant
const sizes = buttonOptions.size

const meta = {
  tags: ['autodocs'],
  title: 'UI Kit/Actions/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component:
          'Use buttons for actions. Choose primary for the main action, secondary or ghost for supporting actions, and destructive for removal. IconButton needs an accessible label. Sizes are lg (48px), sm (40px) and xs (32px). IconButton shape defaults to rounded; choose circle for standalone actions. Explore sizes, icons and disabled states below.',
      },
    },
    controls: { disable: true },
    layout: 'fullscreen',
  },
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
              <AddIcon data-icon="inline-start" />
              Add item
            </Button>
            <Button variant={variant} disabled>
              Save changes
            </Button>
          </div>
        ))}
      </section>
      <section className="grid gap-4">
        <h2 className="text-ui-16 font-medium">Sizes</h2>
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
        <h2 className="text-ui-16 font-medium">Only icon</h2>
        <div className="flex flex-wrap items-end gap-6">
          {sizes.map(size => (
            <div key={size} className="grid justify-items-start gap-2">
              <span className="text-ui-secondary">{size}</span>
              <IconButton size={size} label="Add item">
                <AddIcon />
              </IconButton>
              <IconButton size={size} shape="circle" label="Add item (circle)">
                <AddIcon />
              </IconButton>
            </div>
          ))}
        </div>
      </section>
    </div>
  ),
}

export const IconButtons: Story = {
  render: args => (
    <div className="flex flex-wrap gap-4">
      <IconButton {...args} label="Add item">
        <AddIcon />
      </IconButton>
      <IconButton {...args} label="Continue">
        <ArrowForwardIcon />
      </IconButton>
      <IconButton {...args} label="Without tooltip" tooltip={false}>
        <AddIcon />
      </IconButton>
    </div>
  ),
  play: async ({ canvasElement, args, step }) => {
    if (args.disabled) return
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const button = canvas.getByRole('button', { name: 'Add item' })

    await step('Hover reveals the button label', async () => {
      await userEvent.hover(button)
      await waitFor(() => expect(body.getByText('Add item')).toBeVisible())
      await userEvent.unhover(button)
      await waitFor(() =>
        expect(body.queryByText('Add item')).not.toBeInTheDocument()
      )
    })

    await step(
      'Keyboard focus reveals the label; Escape preserves focus',
      async () => {
        button.focus()
        await waitFor(() => expect(body.getByText('Add item')).toBeVisible())
        await userEvent.keyboard('{Escape}')
        await waitFor(() =>
          expect(body.queryByText('Add item')).not.toBeInTheDocument()
        )
        await expect(button).toHaveFocus()
      }
    )

    await step(
      'Without a tooltip, the button still has an accessible name',
      async () => {
        const withoutTooltip = canvas.getByRole('button', {
          name: 'Without tooltip',
        })
        withoutTooltip.focus()
        await expect(withoutTooltip).toHaveFocus()
        await expect(
          body.queryByText('Without tooltip')
        ).not.toBeInTheDocument()
      }
    )
  },
}

/** Compact controls share the 32px height; icon shapes keep a square hit area. */
export const Compact: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="xs">Save</Button>
      <Button size="xs" variant="secondary">
        <AddIcon data-icon="inline-start" />
        Add item
      </Button>
      <IconButton size="xs" variant="ghost" label="Rounded action">
        <AddIcon />
      </IconButton>
      <IconButton size="xs" shape="circle" label="Circular action">
        <AddIcon />
      </IconButton>
      <IconButton size="xs" shape="circle" label="Disabled action" disabled>
        <AddIcon />
      </IconButton>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    for (const button of canvas.getAllByRole('button')) {
      expect(button.getBoundingClientRect().height).toBe(32)
    }
    for (const name of [
      'Rounded action',
      'Circular action',
      'Disabled action',
    ]) {
      expect(
        canvas.getByRole('button', { name }).getBoundingClientRect().width
      ).toBe(32)
    }
    const circle = canvas.getByRole('button', { name: 'Circular action' })
    expect(
      parseFloat(getComputedStyle(circle).borderTopLeftRadius)
    ).toBeGreaterThanOrEqual(16)
    expect(
      canvas.getByRole('button', { name: 'Disabled action' })
    ).toBeDisabled()
    canvas.getByRole('button', { name: 'Rounded action' }).focus()
    await userEvent.tab()
    expect(circle).toHaveFocus()
  },
}

/** Explicit icon sizes survive button styling; the application default is 20px. */
export const IconSizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <IconButton label="Small icon">
        <AddIcon size={16} />
      </IconButton>
      <IconButton label="Default icon">
        <AddIcon />
      </IconButton>
      <IconButton label="Large icon">
        <AddIcon size={24} />
      </IconButton>
      <Button>
        <AddIcon size={16} data-icon="inline-start" />
        Small leading icon
      </Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    for (const [label, size] of [
      ['Small icon', 16],
      ['Default icon', 20],
      ['Large icon', 24],
      ['Small leading icon', 16],
    ] as const) {
      const icon = canvas
        .getByRole('button', { name: label })
        .querySelector('svg')!
      expect(icon.getBoundingClientRect().width).toBe(size)
      expect(icon.getBoundingClientRect().height).toBe(size)
    }
  },
}
