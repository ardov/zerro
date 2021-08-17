import React from 'react'
import { Story, Meta } from '@storybook/react'
import { AmountInput, AmountInputProps } from 'components/AmountInput'

export default {
  title: 'AmountInput',
  component: AmountInput,
  argTypes: {
    backgroundColor: { control: 'color' },
  },
} as Meta

const Template: Story<AmountInputProps> = args => <AmountInput {...args} />

export const Primary = Template.bind({})
Primary.args = { value: 12004.23, currency: 'RUB', label: 'Доход' }
