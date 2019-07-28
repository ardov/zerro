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
export class BudgetCell extends React.Component {
  state = {
    budgeted: this.props.isChild
      ? this.props.tag.budgeted
      : this.props.tag.totalBudgeted,
  }
  onChange = val => {
    this.setState({ budgeted: val })
    this.props.onUpdate(val, this.props.date, this.props.tag.id)
  }
  render() {
    const { tag, isChild } = this.props
    const { budgeted } = this.state
    const availible = isChild ? tag.availible : tag.totalAvailible
    const orginalBudgeted = isChild ? tag.budgeted : tag.totalBudgeted

    return (
      <Dropdown
        trigger={['click']}
        overlay={
          <Menu>
            <Menu.Item
              key="0"
              onClick={() => this.onChange(orginalBudgeted - availible)}
            >
              Сбросить остаток в ноль (
              {formatMoney(orginalBudgeted - availible)})
            </Menu.Item>
          </Menu>
        }
      >
        <StyledInput
          value={budgeted}
          formatter={value => formatMoney(value, null, 0)}
          parser={value => +value.replace(' ', '').replace(',', '.')}
          decimalSeparator="."
          onChange={this.onChange}
        />
      </Dropdown>
    )
  }
}
