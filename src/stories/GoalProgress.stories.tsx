import React from 'react'
import { Story, Meta } from '@storybook/react'
import { RadialProgress, RadialProgressProps } from 'shared/ui/RadialProgress'

export default {
  title: 'GoalProgress',
  component: RadialProgress,
  argTypes: {
    value: { control: { type: 'range', min: -1, max: 2, step: 0.1 } },
    size: { control: { type: 'range', min: 8, max: 120, step: 4 } },
  },
} as Meta

const Template: Story<RadialProgressProps> = args => (
  <RadialProgress {...args} />
)
export const Progress = Template.bind({})
Progress.args = {
  size: 16,
  value: 0.4,
}
