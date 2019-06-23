import React from 'react'
import { Table } from 'antd'
import { formatMoney } from 'Utils/format'

export function TagTable({ tags, instrument }) {
  const formatSum = sum => formatMoney(sum, instrument.shortTitle)
  const columns = [
    {
      title: 'Категрия',
      dataIndex: 'name',
      key: 'name',
      render: text => text
    },
    {
      title: 'Бюджет',
      dataIndex: 'budgeted',
      key: 'budgeted',
      render: text => text
    },
    {
      title: 'Потрачено',
      dataIndex: 'outcome',
      key: 'outcome',
      render: text => text
    },
    {
      title: 'Доступно',
      dataIndex: 'availible',
      key: 'availible',
      render: text => text
    }
  ]
  const tableData = tags.map(tag => ({
    key: tag.id,
    name: tag.title,
    budgeted: tag.totalBudgeted ? formatSum(tag.totalBudgeted) : '-',
    availible: tag.totalAvailible ? formatSum(tag.totalAvailible) : '-',
    outcome: tag.totalOutcome ? formatSum(tag.totalOutcome) : '-'
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
