import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { TagSelect2 } from './TagSelect2'

const meta = {
  title: 'Transactions/Tag select',
  parameters: { layout: 'centered', app: { scenario: 'demo' } },
} satisfies Meta
export default meta
type Story = StoryObj

/** The first tag is highlighted the moment the list opens. */
export const Interaction: Story = {
  render: () => <TagSelect2 onChange={() => {}} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getAllByRole('button')[0])
    const popup = await body.findByRole('dialog', {
      name: 'Select category',
    })
    const rows = within(popup).getAllByRole('button')
    const owned = rows.find(row => row.hasAttribute('data-selected'))!
    await expect(owned).toHaveAttribute('data-selected')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(popup).not.toBeVisible())
  },
}

export const DarkInteraction: Story = {
  ...Interaction,
  globals: { theme: 'dark' },
}
