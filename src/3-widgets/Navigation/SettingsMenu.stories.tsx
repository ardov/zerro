import type { Meta, StoryObj } from '@storybook/react-vite'
import { MenuButton } from './MenuButton'
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test'

const meta = {
  title: 'App/Navigation/SettingsMenu',
  component: MenuButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    app: { scenario: 'demo', globalWidgets: true },
  },
} satisfies Meta<typeof MenuButton>

export default meta
type Story = StoryObj

const checkNestedConfirm: Story['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const body = within(canvasElement.ownerDocument.body)
  const trigger = canvas.getByRole('button', { name: 'Settings' })
  await userEvent.click(trigger)
  // The rows are toolbar buttons, not `menuitem`s: the list is not a popup
  // that something opened, so it does not promise menu semantics.
  const list = await body.findByRole('toolbar', { name: 'Settings' })
  const reload = await within(list).findByRole('button', {
    name: 'Reload data',
  })
  await userEvent.click(reload)
  const cancel = await body.findByRole('button', { name: 'Cancel' })
  await waitFor(() =>
    expect(cancel.closest('[role="dialog"]')).toContainElement(
      document.activeElement as HTMLElement
    )
  )
  await userEvent.click(cancel)
  await waitFor(() => expect(cancel).not.toBeVisible())
  await waitFor(() => expect(reload).toHaveFocus())
  await expect(reload.matches(':focus-visible')).toBe(false)
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(trigger).toHaveFocus())
  await expect(trigger.matches(':focus-visible')).toBe(true)
}

export const Desktop: Story = {
  args: { showLinks: true },
  render: args => (
    <div className="min-h-[360px]">
      <MenuButton {...args} />
    </div>
  ),
  play: checkNestedConfirm,
}

export const Mobile: Story = {
  globals: { viewport: { value: 'iphone13' } },
  args: { showLinks: true },
  render: args => <MenuButton {...args} />,
  play: checkNestedConfirm,
}

/** Asked content mounts already open; the mobile sheet must nevertheless get
 * a closed starting frame and travel up from the bottom. */
export const MobileEntrance: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { viewport: { value: 'iphone13' } },
  args: { showLinks: true },
  render: args => <MenuButton {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const doc = canvasElement.ownerDocument
    fireEvent.click(canvas.getByRole('button', { name: 'Settings' }))
    const popup = await within(doc.body).findByRole('dialog', {
      name: 'Settings',
    })
    expect(popup).toHaveAttribute('data-starting-style')
    expect(getComputedStyle(popup).transform).not.toBe('none')
    await waitFor(() =>
      expect(popup).not.toHaveAttribute('data-starting-style')
    )
  },
}
