import React from 'react'
import { Meta, StoryObj } from '@storybook/react'
import { TagSelect } from '../5-entities/tag/ui/TagSelect'
import { context } from './shared/context'

const meta = {
  title: 'TagSelect',
  component: TagSelect,
  decorators: [context],
} satisfies Meta<typeof TagSelect>

export default meta
type Story = StoryObj<typeof meta>

export const TagSelectStory: Story = {
  args: {
    onChange: (value: string | null) => console.log(value),
  }
}
