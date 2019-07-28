import React from 'react'
import { connect } from 'react-redux'
import debounce from 'lodash/debounce'
import { Table } from 'antd'
import { formatMoney } from 'helpers/format'
import { setOutcomeBudget } from 'store/data/budgets'
import { BudgetCell } from './BudgetCell'

function TagTable({ tags, instrument, date, updateBudget }) {
  const formatSum = sum => formatMoney(sum, instrument.shortTitle)

  const columns = [
    {
      title: 'Категория',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Бюджет',
      dataIndex: 'budgeted',
      key: 'budgeted',
      align: 'right',
      render: ({ date, updateBudget, tag, isChild = false }) => (
        <BudgetCell
          tag={tag}
          key={tag.id + tag.totalBudgeted}
          date={date}
          isChild={isChild}
          onUpdate={debounce(updateBudget, 2000)}
        />
      ),
    },
    {
      title: 'Потрачено',
      dataIndex: 'outcome',
      key: 'outcome',
      align: 'right',
    },
    {
      title: 'Доступно',
      dataIndex: 'availible',
      key: 'availible',
      align: 'right',
    },
  ]

  const tableData = tags
    .filter(tag => tag.showOutcome || tag.totalOutcome || tag.totalAvailible)
    .map(tag => ({
      key: tag.id + '',
      name: tag.title,
      budgeted: { date, updateBudget, tag },
      availible: tag.totalAvailible ? formatSum(tag.totalAvailible) : '-',
      outcome: tag.totalOutcome ? formatSum(tag.totalOutcome) : '-',

      children: tag.children.length
        ? tag.children
            .filter(
              tag => tag.showOutcome || tag.totalOutcome || tag.totalAvailible
            )
            .map(child => ({
              key: child.id,
              name: child.title,
              budgeted: { date, updateBudget, tag: child, isChild: true },
              availible: child.availible ? formatSum(child.availible) : '-',
              outcome: child.outcome ? formatSum(child.outcome) : '-',
            }))
        : null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <Table
      columns={columns}
      dataSource={tableData}
      indentSize={56}
      pagination={false}
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
