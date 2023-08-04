import React from 'react'
import { StoryObj, Meta } from '@storybook/react'
import { AmountInput } from '6-shared/ui/AmountInput'
import { context } from './shared/context'

const meta = {
  title: 'AmountInput',
  component: AmountInput,
  decorators: [context],
} satisfies Meta<typeof AmountInput>

export default meta

type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    value: 12004.23,
    currency: 'RUB',
    label: 'Доход',
  },
}
