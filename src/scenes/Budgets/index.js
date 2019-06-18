import React from 'react'
import { connect } from 'react-redux'
import styled from 'styled-components'

import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'
import { Table, Button } from 'antd'

import Header from 'containers/Header'
import { getAllBudgets } from 'store/data/selectors/budgetView'
import { getRootUser } from 'store/data/selectors/users'
import { formatMoney } from 'Utils/format'
import AccountList from 'containers/AccountList'

const getMonthName = date =>
  format(date, 'MMM YYYY', { locale: ru }).toUpperCase()

function Budget(props) {
  const { month, instrument } = props
  const formatSum = sum => formatMoney(sum, instrument.shortTitle)
  const {
    date,
    prevOverspent,
    funds,
    toBeBudgeted,
    income,
    outcome,
    availible,
    overspent,
    prevFunds,
    transferIncome,
    transferOutcome,
    budgeted
  } = month

  return (
    <div>
      <h1>{getMonthName(date)}</h1>
      <h2>Забюджетируй {formatSum(toBeBudgeted)}</h2>
      <p>
        Остаток с прошлого месяца {formatSum(prevFunds - prevOverspent)} (
        {formatSum(prevFunds)} - {formatSum(prevOverspent)})
      </p>
      <p>На балансе в конце месяца {formatSum(funds - overspent)}</p>
      <p>-</p>
      <p>Перерасхоод с прошлого месяца {formatSum(prevOverspent)}</p>
      <p>Забюджетирвано {formatSum(budgeted)}</p>
      <p>Доступно {formatSum(availible)}</p>
      <p>Доход {formatSum(income)}</p>
      <p>
        Переводы вне баланса {formatSum(transferIncome - transferOutcome)} (+
        {formatSum(transferIncome)}, -{formatSum(transferOutcome)})
      </p>
      <p>-</p>
      <p>Расход {formatSum(outcome)}</p>
    </div>
  )
}

function TagTable({ tags, instrument }) {
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
function TransferTable({ transfers, instrument }) {
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

const Wrap = styled.div`
  display: flex;
  flex-direction: row;
`
const Grow1 = styled.div`
  flex-grow: 1;
  padding: 0 12px;
`
const StyledAccountList = styled(AccountList)`
  padding: 40px;
`

class Budgets extends React.Component {
  state = { selected: 0 }
  nextMonth = () => {
    this.setState(prev => ({ selected: ++prev.selected }))
  }
  prevMonth = () => {
    this.setState(prev => ({ selected: --prev.selected }))
  }
  lastMonth = () => {
    this.setState({ selected: this.props.budgets.length - 1 })
  }
  render() {
    const budgets = this.props.budgets
    if (!budgets) return null
    const instrument = this.props.user.currency
    const index = this.state.selected
    console.log(this.props.budgets)

    return (
      <div>
        <Header />
        <Wrap>
          <StyledAccountList />
          <div>
            <Button onClick={this.prevMonth} disabled={!index}>
              Предыдущий
            </Button>
            <Button
              onClick={this.nextMonth}
              disabled={index >= budgets.length - 1}
            >
              Следующий
            </Button>
            <Button onClick={this.lastMonth}>Последний</Button>
            {budgets && (
              <Budget month={budgets[index]} instrument={instrument} />
            )}
          </div>
          <Grow1>
            <TagTable tags={budgets[index].tags} instrument={instrument} />
          </Grow1>
          <Grow1>
            <TransferTable
              transfers={budgets[index].transfers}
              instrument={instrument}
            />
          </Grow1>
        </Wrap>
      </div>
    )
  }
}

const mapStateToProps = (state, props) => ({
  user: getRootUser(state),
  budgets: getAllBudgets(state)
})

export default connect(
  mapStateToProps,
  null
)(Budgets)
