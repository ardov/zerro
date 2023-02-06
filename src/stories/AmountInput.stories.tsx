import React from 'react'
import { Story, Meta } from '@storybook/react'
import { AmountInput, AmountInputProps } from '@shared/ui/AmountInput'
import { context } from './shared/context'

export default {
  title: 'AmountInput',
  component: AmountInput,
  decorators: [context],
  argTypes: {
    backgroundColor: { control: 'color' },
  },
} as Meta

const Template: Story<AmountInputProps> = args => <AmountInput {...args} />

export const Primary = Template.bind({})
Primary.args = { value: 12004.23, currency: 'RUB', label: 'Доход' }
