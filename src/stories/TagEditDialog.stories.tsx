import React from 'react'
import { TagEditDialog, TagEditDialogProps } from '@components/TagEditDialog'
import { Story, Meta } from '@storybook/react'
import { context } from './shared/context'

export default {
  title: 'TagEditDialog',
  component: TagEditDialog,
  decorators: [context],
} as Meta

const Template: Story<TagEditDialogProps> = args => <TagEditDialog {...args} />
export const Dialog = Template.bind({})
Dialog.args = { open: true, onClose: () => {} }
