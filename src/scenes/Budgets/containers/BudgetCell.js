import React from 'react'
import styled from 'styled-components'
import { formatMoney } from 'helpers/format'
import { Menu, Dropdown, InputNumber } from 'antd'

const StyledInput = styled(InputNumber)`
  min-width: 120px;

  .ant-input-number-input {
    padding-right: 24px;
    text-align: right;
  }
`
export default function BudgetCell({
  budgeted,
  available,
  id,
  isChild,
  date,
  onUpdate,
}) {
  const [budgetedClone, setBudgetedClone] = React.useState(budgeted)
  const [isVisible, setVisible] = React.useState(isChild ? !!budgeted : true)

  const showInput = () => setVisible(true)

  const onChange = val => {
    setBudgetedClone(val)
    onUpdate(val, date, id)
  }

  const resetAvailable = () => {
    onChange(budgeted - available)
  }

  return isVisible ? (
    <Dropdown
      trigger={['click']}
      overlay={
        <Menu>
          <Menu.Item key="0" onClick={resetAvailable}>
            Сбросить остаток в ноль ({formatMoney(budgeted - available)})
          </Menu.Item>
        </Menu>
      }
    >
      <StyledInput
        value={budgetedClone}
        formatter={value => formatMoney(value, null, 0)}
        parser={value => +value.replace(' ', '').replace(',', '.')}
        decimalSeparator="."
        onChange={onChange}
      />
    </Dropdown>
  ) : (
    <div onClick={showInput}>-</div>
  )
}
