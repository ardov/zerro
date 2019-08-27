import React from 'react'
import { connect } from 'react-redux'
import { Table } from 'antd'
import { formatMoney } from 'helpers/format'
import { getTransfersOutsideBudget } from '../selectors/getTransfersOutsideBudget'
import { getUserCurrencyCode } from 'store/data/instruments'

function TransferTable({ transfers, currency, ...rest }) {
  const formatSum = sum => formatMoney(sum, currency)
  const columns = [
    {
      title: 'Счёт',
      dataIndex: 'name',
      key: 'name',
      render: text => text,
    },
    {
      title: 'Ушло на счёт',
      dataIndex: 'transfersFromBudget',
      key: 'transfersFromBudget',
      render: text => text,
    },
    {
      title: 'Вернулось со счёта',
      dataIndex: 'transfersToBudget',
      key: 'transfersToBudget',
      render: text => text,
    },
    {
      title: 'Итого',
      dataIndex: 'total',
      key: 'total',
      render: text => text,
    },
  ]
  const tableData = transfers.map(account => ({
    key: account.id,
    name: account.title,
    transfersToBudget: formatSum(account.transfersToBudget),
    transfersFromBudget: formatSum(account.transfersFromBudget),
    total: formatSum(account.transfersToBudget - account.transfersFromBudget),
  }))
  return (
    <Table
      size="small"
      title={() => 'Переводы на счета вне бюджета'}
      columns={columns}
      dataSource={tableData}
      pagination={false}
      {...rest}
    />
  )
}

const mapStateToProps = (state, { index }) => ({
  transfers: getTransfersOutsideBudget(state)[index],
  currency: getUserCurrencyCode(state),
})

export default connect(
  mapStateToProps,
  null
)(TransferTable)