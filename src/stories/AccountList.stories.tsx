import React from 'react'
import { Story, Meta } from '@storybook/react'
import AccountList from 'components/AccountList'

export default {
  title: 'AccountList',
  component: AccountList,
} as Meta

const Template: Story<{}> = args => <AccountList {...args} />

export const Primary = Template.bind({})
Primary.args = {}
