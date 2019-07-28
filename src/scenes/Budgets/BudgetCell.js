import React from 'react'
import { formatMoney } from 'helpers/format'
import { Menu, Dropdown, Input } from 'antd'

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
    const { tag } = this.props
    const { budgeted } = this.state
    console.log('render cell')
    return (
      <Dropdown
        trigger={['click']}
        overlay={
          <Menu>
            <Menu.Item
              key="0"
              onClick={() => this.onChange(budgeted - tag.totalAvailible)}
            >
              Сбросить остаток в ноль (
              {formatMoney(budgeted - tag.totalAvailible)})
            </Menu.Item>
          </Menu>
        }
      >
        <div>
          <Input
            value={budgeted}
            onChange={e => this.onChange(+e.target.value)}
          />
        </div>
      </Dropdown>
    )
  }
}
