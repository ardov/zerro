import React from 'react'
import { Table } from 'antd'
import { formatMoney } from 'Utils/format'
export function TransferTable({ transfers, instrument }) {
  const formatSum = sum => formatMoney(sum, instrument.shortTitle)
  const columns = [
    {
      title: 'Счёт',
      dataIndex: 'name',
      key: 'name',
      render: text => text
    },
    {
      title: 'Ушло на счёт',
      dataIndex: 'transferIncome',
      key: 'transferIncome',
      render: text => text
    },
    {
      title: 'Вернулось со счёта',
      dataIndex: 'transferOutcome',
      key: 'transferOutcome',
      render: text => text
    },
    {
      title: 'Итого',
      dataIndex: 'total',
      key: 'total',
      render: text => text
    }
  ]
  const tableData = transfers.map(account => ({
    key: account.id,
    name: account.title,
    transferOutcome: formatSum(account.transferOutcome),
    transferIncome: formatSum(account.transferIncome),
    total: formatSum(account.transferOutcome - account.transferIncome)
  }))
  return (
    <Table
      title={() => 'Переводы на счета вне бюджета'}
      columns={columns}
      dataSource={tableData}
      pagination={{ defaultPageSize: 100 }}
    />
  )
}
