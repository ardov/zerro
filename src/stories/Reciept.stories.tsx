import React from 'react'
import { StoryObj, Meta } from '@storybook/react'
import { Reciept } from 'widgets/transaction/TransactionPreview/Reciept'
import { context } from './shared/context'

const meta = {
  title: 'Transaction/Details',
  component: Reciept,
  decorators: [context],
} satisfies Meta<typeof Reciept>

export default meta
type Story = StoryObj<typeof meta>

export const QRCode: Story = {
  args: {
    value:
      't=20190320T2303&s=5803.00&fn=9251440300007971&i=141637&fp=4087570038&n=1',
  },
}
