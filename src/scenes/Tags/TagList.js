import React, { Component } from 'react'
import styled from 'styled-components'
import {
  groupTransactionsBy,
  calcMetrics
} from 'store/data/selectors/Utils/transactions'
import Tag from './Tag'

const Group = styled.div`
  margin-top: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
`

export default class TagList extends Component {
  render() {
    const { tags, transactions = [] } = this.props
    const metricsByMonths = groupTransactionsBy('week', transactions).map(
      group => {
        const metrics = calcMetrics(group.transactions)
        return {
          month: group.date,
          total: metrics.total,
          byTag: metrics.byTag
        }
      }
    )
    const metricsTotal = calcMetrics(transactions)

    function addMetrics(tag) {
      tag.metricsTotal = metricsTotal.byTag[tag.id]
      tag.metricsByMonths = metricsByMonths.map(monthMetrics => {
        const metrics = monthMetrics.byTag[tag.id]
          ? monthMetrics.byTag[tag.id]
          : { income: 0, outcome: 0, transactions: [] }
        return { ...{ date: monthMetrics.month }, ...metrics }
      })
    }

    tags.forEach(tag => {
      addMetrics(tag)
      if (tag.children) {
        tag.children.forEach(addMetrics)
      }
    })

    return (
      <div>
        <h1>Доход = {metricsTotal.total.income}</h1>
        <h1>Расход = {metricsTotal.total.outcome}</h1>
        {tags &&
          tags.map(tag => (
            <Group key={tag.id}>
              <Tag tag={tag} />
              {tag.children &&
                tag.children.map(tag => <Tag tag={tag} key={tag.id} />)}
            </Group>
          ))}
      </div>
    )
  }
}
