import React from 'react'
import { connect } from 'react-redux'
import { Table } from 'antd'
import { formatMoney } from 'Utils/format'
import { Menu, Dropdown, Icon } from 'antd'
import { setOutcomeBudget } from 'store/data/selectors/budgets'

function renderBudget({
  formatted,
  totalBudgeted,
  totalAvailible,
  totalOutcome,
  date,
  tagId,
  updateBudget,
}) {
  return (
    <Dropdown
      trigger={['click']}
      overlay={
        <Menu>
          <Menu.Item
            key="0"
            onClick={() =>
              updateBudget(totalBudgeted - totalAvailible, date, tagId)
            }
          >
            Сбросить остаток в ноль
          </Menu.Item>
          <Menu.Item
            key="1"
            onClick={() => updateBudget(totalBudgeted + 1000, date, tagId)}
          >
            Добавить 1000
          </Menu.Item>
        </Menu>
      }
    >
      <div>{formatted}</div>
    </Dropdown>
  )
}

function TagTable({ tags, instrument, date, updateBudget }) {
  const formatSum = sum => formatMoney(sum, instrument.shortTitle)
  const columns = [
    {
      title: 'Категория',
      dataIndex: 'name',
      key: 'name',
      render: text => text,
    },
    {
      title: 'Бюджет',
      dataIndex: 'budgeted',
      key: 'budgeted',
      render: renderBudget,
    },
    {
      title: 'Потрачено',
      dataIndex: 'outcome',
      key: 'outcome',
      render: text => text,
    },
    {
      title: 'Доступно',
      dataIndex: 'availible',
      key: 'availible',
      render: text => text,
    },
  ]
  const tableData = tags.map(tag => ({
    key: tag.id,
    name: tag.title,
    budgeted: {
      formatted: tag.totalBudgeted ? formatSum(tag.totalBudgeted) : '-',
      totalBudgeted: tag.totalBudgeted,
      totalAvailible: tag.totalAvailible,
      totalOutcome: tag.totalOutcome,
      date,
      updateBudget,
      tagId: tag.id,
    },
    availible: tag.totalAvailible ? formatSum(tag.totalAvailible) : '-',
    outcome: tag.totalOutcome ? formatSum(tag.totalOutcome) : '-',
  }))
  return (
    <Table
      title={() => 'Категории'}
      columns={columns}
      dataSource={tableData}
      pagination={{ defaultPageSize: 100 }}
    />
  )
}

const mapDispatchToProps = dispatch => ({
  updateBudget: (outcome, month, tagId) =>
    dispatch(setOutcomeBudget(outcome, month, tagId)),
})

export default connect(
  null,
  mapDispatchToProps
)(TagTable)
