import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { Tooltip } from './Tooltip'

const meta = {
  title: 'UI/Tooltip',
  parameters: { layout: 'centered' },
} satisfies Meta
export default meta
type Story = StoryObj

function Harness({ placement }: { placement?: 'top' | 'bottom' }) {
  return (
    <div className="flex flex-col items-center gap-24 py-24">
      <Tooltip title="A label" placement={placement}>
        <button data-testid="trigger">Tooltip trigger</button>
      </Tooltip>
    </div>
  )
}

const checkTooltip: Story['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const doc = canvasElement.ownerDocument
  const body = within(doc.body)

  const trigger = canvas.getByTestId('trigger')
  await userEvent.hover(trigger)
  const label = await body.findByText('A label', {}, { timeout: 3000 })
  await expect(label.closest<HTMLElement>('[data-slot="tooltip"]')).not.toBe(
    null
  )
  await userEvent.unhover(trigger)
  await waitFor(() =>
    expect(body.queryByText('A label')).not.toBeInTheDocument()
  )
}

export const Default: Story = { render: () => <Harness />, play: checkTooltip }
export const Dark: Story = { ...Default, globals: { theme: 'dark' } }

/** Nothing at all without a title, so a call site can pass a value that may
 * be empty and not branch around it. */
export const NoTitle: Story = {
  render: () => (
    <Tooltip title={undefined}>
      <button>Bare</button>
    </Tooltip>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: 'Bare' })
    await userEvent.hover(trigger)
    await expect(trigger).not.toHaveAttribute('aria-describedby')
  },
}

/** An icon-only trigger receives its accessible name from the tooltip. */
export const NamesItsChild: Story = {
  render: () => (
    <Tooltip title="Settings">
      <button data-testid="owned">
        <span aria-hidden>⚙</span>
      </button>
    </Tooltip>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByTestId('owned')).toHaveAccessibleName('Settings')
    await expect(
      canvas.getAllByRole('button', { name: 'Settings' })
    ).toHaveLength(1)
  },
}
