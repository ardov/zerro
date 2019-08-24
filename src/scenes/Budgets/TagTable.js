import React from 'react'
import styled from 'styled-components'
import { connect } from 'react-redux'
import debounce from 'lodash/debounce'
import { Table } from 'antd'
import { formatMoney } from 'helpers/format'
import { setOutcomeBudget } from './thunks'
import { BudgetCell } from './BudgetCell'

const colorMap = {
  positive: 'var(--text-success)',
  negative: 'var(--color-danger)',
  neutral: 'var(--text-placeholder)',
}

const Available = styled.span`
  color: ${props => colorMap[props.displayType]};
`
const Outcome = styled.span`
  color: ${props =>
    props.value === 0 ? 'var(--text-placeholder)' : 'var(--text-primary)'};
`

function TagTable({ tags, currency, date, updateBudget, ...rest }) {
  const formatSum = sum => formatMoney(sum, currency)

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
          key={`${tag.id}${isChild ? tag.budgeted : tag.totalBudgeted}`}
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
      render: value => <Outcome value={value}>{formatSum(value)}</Outcome>,
    },
    {
      title: 'Остаток',
      dataIndex: 'available',
      key: 'available',
      align: 'right',
      render: props => (
        <Available displayType={getAvailableColor(props)}>
          {formatSum(props.value)}
        </Available>
      ),
    },
  ]

  const tableData = tags
    .filter(tag => tag.showOutcome || tag.totalOutcome || tag.totalAvailable)
    .map(tag => {
      const hasOverspent = !!tag.overspent

      return {
        key: tag.id + '',
        name: tag.title,
        budgeted: { date, updateBudget, tag },
        available: { value: tag.totalAvailable, hasOverspent, isChild: false },
        outcome: tag.totalOutcome,

        children: tag.children.length
          ? tag.children
              .filter(
                child =>
                  child.showOutcome ||
                  child.totalOutcome ||
                  child.totalAvailable
              )
              .map(child => ({
                key: child.id,
                name: child.title,
                budgeted: { date, updateBudget, tag: child, isChild: true },
                available: {
                  value: child.available,
                  hasOverspent,
                  isChild: true,
                  hasBudget: !!child.budgeted,
                },
                outcome: child.outcome,
              }))
          : null,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <Table
      size="small"
      columns={columns}
      dataSource={tableData}
      defaultExpandAllRows={true}
      indentSize={56}
      pagination={false}
      {...rest}
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

function getAvailableColor({ value, hasOverspent, isChild, hasBudget }) {
  if (!isChild || hasBudget) {
    return value === 0 ? 'neutral' : value < 0 ? 'negative' : 'positive'
  } else {
    return value > 0
      ? 'positive'
      : value === 0
      ? 'neutral'
      : hasOverspent
      ? 'negative'
      : 'neutral'
  }
}
