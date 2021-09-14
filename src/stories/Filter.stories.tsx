import React from 'react'
import { Filter, FilterProps } from 'components/Filtering'
import { Story, Meta } from '@storybook/react'

export default {
  title: 'Filter',
  component: Filter,
} as Meta

const Template: Story<FilterProps> = args => <Filter {...args} />
export const FilterStory = Template.bind({})
FilterStory.args = { onConditionChange: () => {} }
