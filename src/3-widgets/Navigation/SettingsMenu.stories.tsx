import type { Meta, StoryObj } from '@storybook/react-vite'
import { MenuButton } from './MenuButton'
import { expect, userEvent, waitFor, within } from 'storybook/test'

const meta = {
  title: 'Navigation/Settings menu',
  component: MenuButton,
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
  const reload = await body.findByRole('menuitem', { name: 'Reload data' })
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
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(trigger).toHaveFocus())
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
