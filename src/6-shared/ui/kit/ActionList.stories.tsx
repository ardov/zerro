import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { ActionList, ActionListItem } from './ActionList'

const meta = {
  title: 'UI Kit/Lists/ActionList',
  component: ActionList,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Vertical action toolbar with a single Tab stop. Arrows stop at the ends and skip disabled actions; Home/End and typeahead move focus. Use ref.focus() to enter the list and onNavigateBefore to return from its first action to an associated field.',
      },
    },
  },
  args: { 'aria-label': 'Actions' },
} satisfies Meta<typeof ActionList>
export default meta
type Story = StoryObj<typeof meta>
const activate = fn()
export const Bench: Story = {
  render: args => (
    <ActionList {...args}>
      <ActionListItem onClick={activate}>Assign</ActionListItem>
      <ActionListItem disabled>Archive</ActionListItem>
      <ActionListItem>Move</ActionListItem>
      <ActionListItem>Reset</ActionListItem>
    </ActionList>
  ),
}
export const Keyboard: Story = {
  ...Bench,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const assign = canvas.getByRole('button', { name: 'Assign' })
    assign.focus()
    await userEvent.keyboard('{ArrowUp}')
    await expect(assign).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(canvas.getByRole('button', { name: 'Move' })).toHaveFocus()
    await userEvent.keyboard('{End}{ArrowDown}')
    await expect(canvas.getByRole('button', { name: 'Reset' })).toHaveFocus()
    await userEvent.keyboard('{Shift>}A{/Shift}')
    await expect(assign).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect(activate).toHaveBeenCalledTimes(1)
    await userEvent.keyboard('{End}{Home}')
    await expect(assign).toHaveFocus()
  },
}
