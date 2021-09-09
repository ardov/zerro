import React from 'react'
import { Story, Meta } from '@storybook/react'
import { TagSelect, TagSelectProps } from 'components/TagSelect'

export default {
  title: 'TagSelect',
  component: TagSelect,
} as Meta

const Template: Story<TagSelectProps> = args => <TagSelect {...args} />
export const TagSelectStory = Template.bind({})
