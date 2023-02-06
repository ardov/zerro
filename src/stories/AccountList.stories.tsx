import React from 'react'
import { Story, Meta } from '@storybook/react'
import AccountList from '@components/AccountList'
import { context } from './shared/context'

export default {
  title: 'AccountList',
  component: AccountList,
  decorators: [context],
} as Meta

const Template: Story<{}> = args => <AccountList {...args} />

export const Primary = Template.bind({})
Primary.args = {}
