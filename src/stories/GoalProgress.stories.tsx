import React from 'react'
import { Meta, StoryObj } from '@storybook/react'
import { RadialProgress } from '6-shared/ui/RadialProgress'

const meta = {
  title: 'GoalProgress',
  component: RadialProgress,
  argTypes: {
    value: { control: { type: 'range', min: -1, max: 2, step: 0.1 } },
    size: { control: { type: 'range', min: 8, max: 120, step: 4 } },
  },
} satisfies Meta<typeof RadialProgress>

export default meta

type Story = StoryObj<typeof meta>

export const Progress: Story = {
  args: { size: 16, value: 0.4 },
}
