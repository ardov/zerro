import React from 'react'
import { Story, Meta } from '@storybook/react'
import { Reciept } from 'components/TransactionPreview/Reciept'
import { Map } from 'components/TransactionPreview/Map'

export default {
  title: 'Transaction/Details',
  component: Reciept,
} as Meta

const QRCodeTemplate: Story<{}> = args => <Reciept {...args} />
export const QRCode = QRCodeTemplate.bind({})
QRCode.args = {
  value:
    't=20190320T2303&s=5803.00&fn=9251440300007971&i=141637&fp=4087570038&n=1',
}

const MapTemplate: Story<{}> = args => <Map {...args} />
export const MapComp = MapTemplate.bind({})
MapComp.args = {
  longitude: 30.321,
  latitude: 60.0762,
}
