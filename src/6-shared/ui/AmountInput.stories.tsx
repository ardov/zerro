import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { AmountInput } from './AmountInput'

const meta = {
  title: 'UI/AmountInput',
  component: AmountInput,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof AmountInput>

export default meta
type Story = StoryObj

function ControlledInput(props: { signButtons?: boolean | 'auto' }) {
  const [value, setValue] = useState(1250)
  return (
    <AmountInput
      label="Amount"
      value={value}
      currency="RUB"
      signButtons={props.signButtons}
      onChange={setValue}
      onEnter={setValue}
      className="w-[280px]"
    />
  )
}

export const Default: Story = {
  render: () => <ControlledInput />,
}

export const WithExpressionButtons: Story = {
  render: () => <ControlledInput signButtons />,
}
