import React from 'react'
import { connect } from 'react-redux'
import debounce from 'lodash/debounce'
import { Table } from 'antd'
import { formatMoney } from 'helpers/format'
import { Menu, Dropdown, Input } from 'antd'
import { setOutcomeBudget } from 'store/data/budgets'

class BudgetCell extends React.Component {
  state = { budgeted: this.props.tag.totalBudgeted }

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
      render: ({ date, updateBudget, tag }) => (
        <BudgetCell
          tag={tag}
          key={tag.id + tag.totalBudgeted}
          date={date}
          onUpdate={debounce(updateBudget, 2000)}
        />
      ),
    },
    {
      title: 'Потрачено',
      dataIndex: 'outcome',
      key: 'outcome',
    },
    {
      title: 'Доступно',
      dataIndex: 'availible',
      key: 'availible',
    },
  ]

  const tableData = tags
    .reduce((arr, tag) => {
      if (tag.showOutcome || tag.totalOutcome || tag.totalAvailible) {
        arr.push({
          key: tag.id + '',
          name: tag.title,
          budgeted: { date, updateBudget, tag },
          availible: tag.totalAvailible ? formatSum(tag.totalAvailible) : '-',
          outcome: tag.totalOutcome ? formatSum(tag.totalOutcome) : '-',
        })

        // if (tag.children.length) {
        //   arr.push({
        //     key: tag.id + '2',
        //     name: '-----  Без подкатегории',
        //     budgeted: {
        //       formatted: tag.budgeted ? formatSum(tag.budgeted) : '-',
        //       totalBudgeted: tag.budgeted,
        //       totalAvailible: tag.availible,
        //       totalOutcome: tag.outcome,
        //       date,
        //       updateBudget,
        //       tagId: tag.id,
        //     },
        //     availible: tag.availible ? formatSum(tag.availible) : '-',
        //     outcome: tag.outcome ? formatSum(tag.outcome) : '-',
        //   })

        //   tag.children.forEach(child =>
        //     arr.push({
        //       key: child.id,
        //       name: '-----  ' + child.title,
        //       budgeted: {
        //         formatted: child.budgeted ? formatSum(child.budgeted) : '-',
        //         totalBudgeted: child.budgeted,
        //         totalAvailible: child.availible,
        //         totalOutcome: child.outcome,
        //         date,
        //         updateBudget,
        //         tagId: child.id,
        //       },
        //       availible: child.availible ? formatSum(child.availible) : '-',
        //       outcome: child.outcome ? formatSum(child.outcome) : '-',
        //     })
        //   )
        // }
      }
      return arr
    }, [])
    .sort((a, b) => a.name.localeCompare(b.name))
  return <Table columns={columns} dataSource={tableData} pagination={false} />
}

const mapDispatchToProps = dispatch => ({
  updateBudget: (outcome, month, tagId) =>
    dispatch(setOutcomeBudget(outcome, month, tagId)),
})

export default connect(
  null,
  mapDispatchToProps
)(TagTable)
