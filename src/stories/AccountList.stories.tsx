import AccountList from 'widgets/AccountList'
import { context } from './shared/context'

import type { Meta, StoryObj } from '@storybook/react'

const meta = {
  title: 'AccountList',
  component: AccountList,
  decorators: [context],
} satisfies Meta<typeof AccountList>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = { args: {} }
