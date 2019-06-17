import React from 'react'
import { connect } from 'react-redux'

import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'
import { Table, Divider, Tag, Button } from 'antd'

import Header from 'containers/Header'
import { getAllBudgets } from 'store/data/selectors/budgetView'
import { getRootUser } from 'store/data/selectors/users'
import { formatMoney } from 'Utils/format'

const getMonthName = date =>
  format(date, 'MMMM YYYY', { locale: ru }).toUpperCase()

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
    transferIncome,
    transferOutcome,
    budgeted,
    tags
  } = month

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
    budgeted: formatSum(tag.totalBudgeted),
    availible: formatSum(tag.totalAvailible),
    outcome: formatSum(tag.totalOutcome)
  }))

  return (
    <div>
      <h1>
        {getMonthName(date)} ••• доступно {formatSum(toBeBudgeted)}
      </h1>
      <p>
        Переводы вне баланса {formatSum(transferIncome - transferOutcome)} (+
        {formatSum(transferIncome)}, -{formatSum(transferOutcome)})
      </p>
      <p>Доход {formatSum(income)}</p>
      <p>Расход {formatSum(outcome)}</p>
      <p>Забюджетирвано {formatSum(budgeted)}</p>
      <h2>Категрии</h2>

      <Table
        title={() => 'Категрии'}
        columns={columns}
        dataSource={tableData}
        pagination={{ defaultPageSize: 100 }}
      />
    </div>
  )
}

class Budgets extends React.Component {
  state = { selected: 0 }
  nextMonth = () => {
    this.setState(prev => ({ selected: ++prev.selected }))
  }
  prevMonth = () => {
    this.setState(prev => ({ selected: --prev.selected }))
  }
  render() {
    const budgets = this.props.budgets
    const instrument = this.props.user.currency
    const index = this.state.selected
    console.log(this.props.budgets)

    return (
      <div>
        <Header />
        <Button onClick={this.prevMonth}>Предыдущий месяц</Button>
        <Button onClick={this.nextMonth}>Следующий месяц</Button>
        {budgets && <Budget month={budgets[index]} instrument={instrument} />}
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
