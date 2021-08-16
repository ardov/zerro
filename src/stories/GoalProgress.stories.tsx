import React from 'react'
import { Story, Meta } from '@storybook/react'
import { GoalProgress, GoalProgressProps } from 'components/GoalProgress'

export default {
  title: 'GoalProgress',
  component: GoalProgress,
  argTypes: {
    value: { control: { type: 'range', min: -1, max: 2, step: 0.1 } },
    size: { control: { type: 'range', min: 8, max: 120, step: 4 } },
  },
} as Meta

const Template: Story<GoalProgressProps> = args => <GoalProgress {...args} />
export const Progress = Template.bind({})
Progress.args = {
  size: 16,
  value: 0.4,
}
