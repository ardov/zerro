import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Popover } from '@base-ui/react/popover'
import { Wallet, Plus } from 'lucide-react'
import { expect, userEvent, within } from 'storybook/test'
import { SelectTrigger } from './SelectTrigger'
import { Input } from './Input'
import { Button } from './Button'
import { ListPanel } from './ListPanel'
import { useListPanelPositioning } from './useListPanelPositioning'

const meta = {
  title: 'UI Kit/SelectTrigger',
  component: SelectTrigger,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `Field appearance for a picker trigger, in **lg** and **sm** sizes.

- Pass **filled**, the selected label as children, and an optional decorative **start** image. Omit start for text-only display.
- Compose a popup trigger through **render**. Popup state and form value belong to the picker; this component only renders the closed field.
- **onClear** replaces the chevron for an optional filled value. Supply a localized **clearLabel**. Clearing returns focus without opening the panel.
- **readOnly** stays focusable; disabled and read-only fields hide actions and use Field hatching.
- A custom trigger uses the popup primitive directly; it does not need a field wrapper.

See **Playground** for a minimal field and **Interaction** for popup composition.`,
      },
    },
  },
  args: { label: 'Account', children: 'Everyday account', filled: true },
} satisfies Meta<typeof SelectTrigger>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const Showcase: Story = {
  render: () => (
    <div className="grid max-w-3xl gap-8 sm:grid-cols-2">
      {(['lg', 'sm'] as const).map(size => (
        <section key={size} className="grid content-start gap-4">
          <h2>{size}</h2>
          <Input
            size={size}
            label="Reference input"
            defaultValue="Everyday account"
          />
          <SelectTrigger size={size} label="Account" filled>
            Everyday account
          </SelectTrigger>
          <SelectTrigger size={size} label="Account" filled start={<Wallet />}>
            Everyday account
          </SelectTrigger>
          <SelectTrigger
            size={size}
            label="Account"
            placeholder="Choose an account"
          />
          <SelectTrigger size={size} label="Account" labelMode="floating" />
          <SelectTrigger
            size={size}
            label="Account"
            labelMode="floating"
            filled
          >
            Everyday account
          </SelectTrigger>
          <SelectTrigger size={size} label="Account" filled readOnly>
            Read-only account
          </SelectTrigger>
          <SelectTrigger size={size} label="Account" filled disabled>
            Disabled account
          </SelectTrigger>
          <SelectTrigger
            size={size}
            label="Account"
            error="Choose an account"
          />
        </section>
      ))}
    </div>
  ),
}
function Demo() {
  const [filled, setFilled] = useState(true)
  const [open, setOpen] = useState(false)
  const positioning = useListPanelPositioning()
  return (
    <div className="grid max-w-sm gap-4">
      <Popover.Root open={open} onOpenChange={setOpen}>
        <SelectTrigger
          label="Account"
          filled={filled}
          placeholder="Choose an account"
          start={filled ? <Wallet /> : undefined}
          onClear={() => setFilled(false)}
          description="Account used for this transaction"
          render={<Popover.Trigger />}
        >
          Everyday account
        </SelectTrigger>
        <Popover.Portal>
          <Popover.Positioner {...positioning}>
            <Popover.Popup render={<ListPanel />}>
              <p className="p-3">Trigger composition preview</p>
              <Button
                onClick={() => {
                  setFilled(true)
                  setOpen(false)
                }}
              >
                Use everyday account
              </Button>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
      <SelectTrigger
        label="Read-only account"
        readOnly
        filled
        onClear={() => setFilled(false)}
        render={<Popover.Trigger />}
      >
        Savings
      </SelectTrigger>
      <SelectTrigger label="Disabled account" disabled filled>
        Savings
      </SelectTrigger>
      <SelectTrigger
        label="Required account"
        required
        filled
        onClear={() => setFilled(false)}
      >
        Savings
      </SelectTrigger>
      <Popover.Root>
        <Popover.Trigger render={<Button variant="secondary" />}>
          <Plus /> Add filter
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner {...positioning}>
            <Popover.Popup render={<ListPanel />}>
              <p className="p-3">A custom trigger uses the same panel.</p>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  )
}
export const Interaction: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole('button', { name: /^Account / })
    await expect(trigger).toHaveAccessibleDescription(
      'Account used for this transaction'
    )
    await userEvent.click(
      canvas.getByRole('button', { name: 'Clear selection' })
    )
    await expect(trigger).toHaveFocus()
    await expect(trigger).toHaveTextContent('Choose an account')
    await expect(
      body.queryByText('Trigger composition preview')
    ).not.toBeInTheDocument()
    await userEvent.keyboard('{Enter}')
    await expect(
      await body.findByText('Trigger composition preview')
    ).toBeVisible()
    await userEvent.click(
      body.getByRole('button', { name: 'Use everyday account' })
    )
    await expect(trigger).toHaveTextContent('Everyday account')
    await expect(trigger).toHaveFocus()
    await userEvent.tab()
    await expect(
      canvas.getByRole('button', { name: 'Clear selection' })
    ).toHaveFocus()
    await userEvent.tab()
    await expect(
      canvas.getByRole('button', { name: 'Read-only account Savings' })
    ).toHaveFocus()
    await userEvent.keyboard('{Enter} ')
    await expect(
      body.queryByText('Trigger composition preview')
    ).not.toBeInTheDocument()
    await userEvent.tab()
    await expect(
      canvas.getByRole('button', { name: 'Required account Savings' })
    ).toHaveFocus()
    await expect(
      canvas.getAllByRole('button', { name: 'Clear selection' })
    ).toHaveLength(1)
    await userEvent.click(canvas.getByRole('button', { name: 'Add filter' }))
    await expect(
      await body.findByText('A custom trigger uses the same panel.')
    ).toBeVisible()
    await userEvent.keyboard('{Escape}')
    await expect(
      canvas.getByRole('button', { name: 'Add filter' })
    ).toHaveFocus()
  },
}
