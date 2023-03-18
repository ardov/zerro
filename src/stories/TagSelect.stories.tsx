import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import { TagSelect } from '../components/TagSelect'
import { context } from './shared/context'

export default {
  title: 'TagSelect',
  component: TagSelect,
  decorators: [context],
} as ComponentMeta<typeof TagSelect>

const Template: ComponentStory<typeof TagSelect> = args => (
  <TagSelect {...args} />
)

export const TagSelectStory = Template.bind({})
