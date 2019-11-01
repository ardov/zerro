import React from 'react'
import { storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import Reciept from 'components/DetailsDrawer/Reciept'
import decorator from 'helpers/storybookDecorator'
import Map from 'components/DetailsDrawer/Map'

const value =
  't=20190320T2303&s=5803.00&fn=9251440300007971&i=141637&fp=4087570038&n=1'

export const actions = {
  onClose: action('onClose'),
}

storiesOf('Drawer components', module)
  .addDecorator(decorator({ width: 360 - 32 }))
  .add('Reciept', () => <Reciept value={value} {...actions} />)
  .add('Map', () => (
    <Map longitude={30.321} latitude={60.0762313} {...actions} />
  ))
