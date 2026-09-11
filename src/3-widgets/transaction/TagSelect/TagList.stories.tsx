import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { TagList } from './TagList'

const meta = {
  title: 'App/Transactions/TagList',
  component: TagList,
  parameters: { app: { scenario: 'demo', route: '/transactions' } },
} satisfies Meta<typeof TagList>
export default meta

export const EditAndRemove: StoryObj = {
  render: function Render() {
    const [tags, setTags] = useState(['Food'])
    return <TagList tags={tags} onChange={setTags} tagType="outcome" />
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(document.body)
    const edit = canvas.getByRole('button', { name: 'Food' })
    await userEvent.click(edit)
    await body.findByRole('dialog')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
    await expect(edit).toHaveFocus()
    await userEvent.click(canvas.getByRole('button', { name: 'Remove Food' }))
    await waitFor(() =>
      expect(canvas.queryByRole('button', { name: 'Food' })).toBeNull()
    )
    await expect(body.queryByRole('dialog')).toBeNull()
    await expect(canvas.getByRole('button')).toHaveFocus()
  },
}
