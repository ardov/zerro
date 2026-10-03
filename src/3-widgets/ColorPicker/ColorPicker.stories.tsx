import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { useAsk } from '@/6-shared/overlays'
import { Button } from '@/6-shared/ui/kit/Button'
import { Dialog } from '@/6-shared/ui/kit/Dialog'
import { ColorPicker } from './index'

function Demo() {
  const ask = useAsk()
  const [value, setValue] = useState<string | null>('#CC3077')
  const [commits, setCommits] = useState(0)
  return (
    <Dialog title="Editor" trigger={<Button>Open editor</Button>}>
      <Button
        onClick={async event => {
          const result = await ask<string | null>(
            <ColorPicker value={value} anchorEl={event.currentTarget} />
          )
          if (result !== undefined) {
            setValue(result)
            setCommits(count => count + 1)
          }
        }}
      >
        Choose color
      </Button>
      <output aria-label="Selected color">{value ?? 'none'}</output>
      <output aria-label="Commits">{commits}</output>
    </Dialog>
  )
}
const meta = {
  title: 'Widgets/ColorPicker',
  component: Demo,
  parameters: { layout: 'centered', historyShortcuts: true },
} satisfies Meta<typeof Demo>
export default meta
type Story = StoryObj<typeof meta>
export const Nested: Story = {
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Open editor' })
    )
    const editor = await body.findByRole('dialog', { name: 'Editor' })
    const trigger = within(editor).getByRole('button', { name: 'Choose color' })
    for (const dismissal of ['{Escape}', '{Alt>}{ArrowLeft}{/Alt}']) {
      await userEvent.click(trigger)
      const picker = await body.findByRole('dialog', { name: 'Color' })
      const input = within(picker).getByRole('textbox', { name: 'HEX color' })
      await userEvent.clear(input)
      await userEvent.type(input, 'rgb(')
      await userEvent.keyboard(dismissal)
      await waitFor(() =>
        expect(body.queryByRole('dialog', { name: 'Color' })).toBeNull()
      )
      await waitFor(() => expect(trigger).toHaveFocus())
      await expect(within(editor).getByLabelText('Commits')).toHaveTextContent(
        '0'
      )
    }
    await userEvent.click(trigger)
    let picker = await body.findByRole('dialog', { name: 'Color' })
    await userEvent.click(
      within(picker).getByRole('button', { name: '#CC3077' })
    )
    await waitFor(() => expect(trigger).toHaveFocus())
    await expect(
      within(editor).getByLabelText('Selected color')
    ).toHaveTextContent('#CC3077')
    await expect(within(editor).getByLabelText('Commits')).toHaveTextContent(
      '1'
    )
    await userEvent.click(trigger)
    picker = await body.findByRole('dialog', { name: 'Color' })
    await userEvent.click(
      within(picker).getByRole('button', { name: 'No color' })
    )
    await waitFor(() => expect(trigger).toHaveFocus())
    await expect(
      within(editor).getByLabelText('Selected color')
    ).toHaveTextContent('none')
    await expect(within(editor).getByLabelText('Commits')).toHaveTextContent(
      '2'
    )
  },
}

export const Mobile: Story = {
  ...Nested,
  globals: { viewport: { value: 'zerro499' } },
}

export const ApplyOnClose: Story = {
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Open editor' })
    )
    const editor = await body.findByRole('dialog', { name: 'Editor' })
    const trigger = within(editor).getByRole('button', { name: 'Choose color' })
    let commits = 0
    for (const [text, expected, dismissal] of [
      ['321', '#332211', '{Escape}'],
      ['rgb(100 100 100)', '#646464', '{Alt>}{ArrowLeft}{/Alt}'],
      ['', 'none', '{Escape}'],
      ['32', '#323232', 'apply'],
    ]) {
      await userEvent.click(trigger)
      const picker = await body.findByRole('dialog', { name: 'Color' })
      const input = within(picker).getByRole('textbox', { name: 'HEX color' })
      await userEvent.clear(input)
      if (text) await userEvent.type(input, text)
      await expect(within(editor).getByLabelText('Commits')).toHaveTextContent(
        String(commits)
      )
      if (dismissal === 'apply') {
        await userEvent.click(
          within(picker).getByRole('button', { name: 'Apply' })
        )
      } else {
        await userEvent.keyboard(dismissal)
      }
      await waitFor(() => expect(trigger).toHaveFocus())
      await expect(
        within(editor).getByLabelText('Selected color')
      ).toHaveTextContent(expected)
      await expect(within(editor).getByLabelText('Commits')).toHaveTextContent(
        String(++commits)
      )
    }
    // Explicit selection/removal wins over a valid, still uncommitted HEX draft.
    for (const action of ['#CC3077', 'No color']) {
      await userEvent.click(trigger)
      const picker = await body.findByRole('dialog', { name: 'Color' })
      const input = within(picker).getByRole('textbox', { name: 'HEX color' })
      await userEvent.clear(input)
      await userEvent.type(input, '#112233')
      await userEvent.click(
        within(picker).getByRole('button', { name: action })
      )
      await waitFor(() => expect(trigger).toHaveFocus())
      await expect(
        within(editor).getByLabelText('Selected color')
      ).toHaveTextContent(action === 'No color' ? 'none' : action)
      await expect(within(editor).getByLabelText('Commits')).toHaveTextContent(
        String(++commits)
      )
    }
  },
}

export const ApplyOnCloseMobile: Story = {
  ...ApplyOnClose,
  globals: { viewport: { value: 'zerro499' } },
}
