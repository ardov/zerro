import type { Meta, StoryObj } from '@storybook/react-vite'
import { Select } from '@base-ui/react/select'
import { Wallet, Landmark } from 'lucide-react'
import { expect, userEvent, within } from 'storybook/test'
import { ListRow, ListRowHeader, ListRowSeparator } from './ListRow'

const meta = {
  title: 'UI Kit/Building blocks/List row',
  component: ListRow,
  tags: ['autodocs'],
  parameters: {
    controls: { disable: true },
    layout: 'padded',
    docs: {
      description: {
        component: `Row layout for lists and pickers, with optional images and secondary text.

- Compose with a semantic element or Base UI item through **render**; the owner handles keyboard interaction, disabled behavior and accessible selection.
- Keep **reserveStart** on every row of a mixed-image list, even while filtering. Start images are decorative.
- Selection is a background; the owner supplies one pointer/keyboard highlight. Pressing moves only the background, respecting reduced motion.
- Trailing values use the same typography and first-line baseline as the label. Wrap secondary metadata in its own smaller text style when needed.
- **ListRowHeader** provides a group label's layout; connect it to the group. **ListRowSeparator** is decorative.

See **Playground** for a minimal row and **Interaction** for Base UI composition.`,
      },
    },
  },
  args: {
    children: 'Everyday account',
    description: 'For groceries and daily expenses',
    size: 'lg',
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['lg', 'sm'] },
    selected: { control: 'boolean' },
    highlighted: { control: 'boolean' },
    reserveStart: { control: 'boolean' },
  },
} satisfies Meta<typeof ListRow>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Showcase: Story = {
  render: () => (
    <div className="grid max-w-4xl gap-8 bg-ui-base p-6 text-ui-primary sm:grid-cols-2">
      {(['lg', 'sm'] as const).map(size => (
        <section key={size}>
          <h2 className="mb-3 text-ui-20">
            {size === 'lg' ? 'Large' : 'Small'}
          </h2>
          <div className="rounded-ui-card bg-ui-card p-1">
            <ListRowHeader size={size}>Accounts · mixed images</ListRowHeader>
            <ListRow size={size} reserveStart start={<Wallet />} end="CZK">
              Everyday account
            </ListRow>
            <ListRow
              size={size}
              reserveStart
              start={<Landmark />}
              description="Selected, at rest"
              selected
              end="EUR"
            >
              Travel savings
            </ListRow>
            <ListRow
              size={size}
              reserveStart
              description="No icon, with the same reserved slot"
            >
              Cash
            </ListRow>
            <ListRow
              size={size}
              reserveStart
              start={
                <img
                  alt=""
                  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='6' fill='%23275bce'/%3E%3Cpath d='M6 17V7h7a3 3 0 010 6H6' fill='none' stroke='white' stroke-width='2'/%3E%3C/svg%3E"
                />
              }
              description="A supplied image uses the same slot"
            >
              Bank logo
            </ListRow>
            <ListRowSeparator />
            <ListRowHeader size={size}>Text only · wrapping</ListRowHeader>
            <ListRow
              size={size}
              description="An explanatory sentence that wraps naturally when the available width is limited."
              end="12 345,67 €"
            >
              A long account name for shared household expenses and recurring
              payments
            </ListRow>
            <ListRow size={size} aria-disabled="true" description="Unavailable">
              Archived account
            </ListRow>
          </div>
          <p className="mt-4 text-ui-14 text-ui-secondary">
            Independent state samples
          </p>
          <div className="mt-2 rounded-ui-card bg-ui-card p-1">
            <ListRow size={size}>Resting</ListRow>
            <ListRow size={size} selected>
              Selected
            </ListRow>
          </div>
          <div className="mt-2 rounded-ui-card bg-ui-card p-1">
            <ListRow size={size} highlighted>
              Highlighted
            </ListRow>
          </div>
          <div className="mt-2 rounded-ui-card bg-ui-card p-1">
            <ListRow size={size} selected highlighted>
              Selected + highlighted
            </ListRow>
          </div>
        </section>
      ))}
    </div>
  ),
}

/** Base UI supplies the one highlight and keyboard semantics, not ListRow. */
export const Interaction: Story = {
  render: () => (
    <Select.Root
      defaultValue="travel"
      items={{ everyday: 'Everyday', travel: 'Travel', locked: 'Unavailable' }}
    >
      <Select.Trigger
        className="rounded-ui-control bg-ui-highlight px-4 py-3 text-ui-primary focusable"
        aria-label="Account"
      >
        <Select.Value />
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner alignItemWithTrigger={false} sideOffset={4}>
          <Select.Popup className="w-72 rounded-ui-popover bg-ui-popover p-1 shadow-ui-card">
            <Select.Group>
              <Select.GroupLabel render={<ListRowHeader />}>
                Accounts
              </Select.GroupLabel>
              <Select.Item
                value="everyday"
                render={<ListRow reserveStart start={<Wallet />} />}
              >
                <Select.ItemText>Everyday</Select.ItemText>
              </Select.Item>
              <Select.Item
                value="travel"
                render={
                  <ListRow reserveStart description="For the next trip" />
                }
              >
                <Select.ItemText>Travel</Select.ItemText>
              </Select.Item>
              <Select.Item
                value="locked"
                disabled
                render={<ListRow reserveStart />}
              >
                <Select.ItemText>Unavailable</Select.ItemText>
              </Select.Item>
            </Select.Group>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole('combobox', { name: 'Account' })
    await userEvent.click(trigger)
    const travel = await body.findByRole('option', { name: /Travel/ })
    await expect(travel).toHaveAttribute('aria-selected', 'true')
    await expect(
      body.getByRole('option', { name: 'Unavailable' })
    ).toHaveAttribute('aria-disabled', 'true')
    await userEvent.hover(body.getByRole('option', { name: 'Everyday' }))
    await userEvent.keyboard('{Enter}')
    await expect(trigger).toHaveTextContent('Everyday')
  },
}
