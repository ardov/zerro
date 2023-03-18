import React from 'react'
import { Filter, FilterProps } from '@components/Filtering'
import { Story, Meta } from '@storybook/react'
import { context } from './shared/context'

export default {
  title: 'Experimental/Filter',
  component: Filter,
  decorators: [context],
} as Meta

const Template: Story<FilterProps> = args => <Filter {...args} />
export const FilterStory = Template.bind({})
FilterStory.args = { onConditionChange: () => {} }
