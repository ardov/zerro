import React from 'react'
import { StoryObj, Meta } from '@storybook/react'
import { Map } from 'widgets/transaction/TransactionPreview/Map'
import { context } from './shared/context'

const meta = {
  title: 'Transaction/Details',
  component: Map,
  decorators: [context],
} satisfies Meta<typeof Map>

export default meta
type Story = StoryObj<typeof meta>

export const MapComp: Story = {
  args: {
    longitude: 30.321,
    latitude: 60.0762,
  },
}
