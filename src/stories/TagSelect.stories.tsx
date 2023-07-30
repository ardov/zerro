import React from 'react'
import { Meta, StoryObj } from '@storybook/react'
import { TagSelect } from '../3-widgets/tag/TagSelect'
import { context } from './shared/context'

const meta = {
  title: 'TagSelect',
  component: TagSelect,
  decorators: [context],
} satisfies Meta<typeof TagSelect>

export default meta
type Story = StoryObj<typeof meta>

export const TagSelectStory: Story = {}
