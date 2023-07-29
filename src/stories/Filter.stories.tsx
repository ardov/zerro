import React from 'react'
import { Filter } from 'widgets/Filtering'
import { Meta, StoryObj } from '@storybook/react'
import { context } from './shared/context'

const meta = {
  title: 'Experimental/Filter',
  component: Filter,
  decorators: [context],
} satisfies Meta<typeof Filter>

export default meta

type Story = StoryObj<typeof meta>

export const FilterStory: Story = {
  args: { onConditionChange: () => {} },
}
