import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { useAsk } from '@/6-shared/overlays'
import { Confirm, type ConfirmProps } from './Confirm'
import { Button } from './Button'

function Confirmation(props: ConfirmProps) {
  const ask = useAsk()
  const [result, setResult] = useState('unanswered')
  return (
    <>
      <Button
        onClick={async () =>
          setResult(
            (await ask<boolean>(<Confirm {...props} />))
              ? 'confirmed'
              : 'cancelled'
          )
        }
      >
        Ask
      </Button>
      <output aria-label="Answer">{result}</output>
    </>
  )
}
const meta = {
  title: 'UI Kit/Confirm',
  component: Confirm,
  parameters: { layout: 'centered' },
  args: {
    title: 'Continue?',
    description: 'The operation starts only after confirmation.',
    okText: 'Continue',
    cancelText: 'Cancel',
  },
  render: args => <Confirmation {...args} />,
} satisfies Meta<typeof Confirm>
export default meta
type Story = StoryObj<typeof meta>
const checkConfirm: Story['play'] = async ({ canvasElement, args }) => {
  const canvas = within(canvasElement)
  const body = within(canvasElement.ownerDocument.body)
  const trigger = canvas.getByRole('button', { name: 'Ask' })
  await userEvent.click(trigger)
  let dialog = await body.findByRole(
    args.intent === 'danger' ? 'alertdialog' : 'dialog',
    { name: 'Continue?' }
  )
  await expect(
    within(dialog).queryByRole('button', { name: 'Close' })
  ).toBeNull()
  await expect(dialog).toHaveAccessibleDescription(args.description)
  await waitFor(() =>
    expect(
      within(dialog).getByRole('button', {
        name: args.intent === 'danger' ? 'Cancel' : 'Continue',
      })
    ).toHaveFocus()
  )
  await userEvent.keyboard('{Escape}')
  await waitFor(() =>
    expect(canvas.getByLabelText('Answer')).toHaveTextContent('cancelled')
  )
  await waitFor(() => expect(trigger).toHaveFocus())
  await userEvent.click(trigger)
  dialog = await body.findByRole(
    args.intent === 'danger' ? 'alertdialog' : 'dialog',
    { name: 'Continue?' }
  )
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Continue' })
  )
  await waitFor(() =>
    expect(canvas.getByLabelText('Answer')).toHaveTextContent('confirmed')
  )
}
export const Ordinary: Story = { play: checkConfirm }
export const Danger: Story = { args: { intent: 'danger' }, play: checkConfirm }
