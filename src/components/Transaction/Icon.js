import React from 'react'
import styled from 'styled-components'
import { Checkbox } from 'antd'

const Body = styled.div`
  grid-area: icon;
  margin-top: -8px;
  width: 40px;
  height: 40px;
  display: flex;

  color: #000;
  line-height: 40px;
  text-align: center;
  font-size: 24px;
`

const Icon = styled.div`
  grid-area: icon;
  margin-top: -8px;
  width: 40px;
  height: 40px;
  border-radius: 20px;
  color: #000;
  line-height: 40px;
  text-align: center;
  font-size: 24px;
`

export function Icon({ isChecked, isInSelectionMode, symbol }) {
  return <div>12</div>
}
