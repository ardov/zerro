import React, { Component } from 'react'
import styled from 'styled-components'
import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'
import { groupTransactionsBy, calcMetrics } from '../Utils/transactions'
import Tag from './Tag'

const Group = styled.section`
  padding-top: 20px;
  position: relative;

  &:first-child {
    padding-top: 0;
  }
`
const Body = styled.div`
  display: flex;
  flex-direction: row;
  min-height: 100vh;
`
const Menu = styled.div`
  width: 200px;
  padding: 40px;
  background: rgba(0, 0, 0, 0.06);
`
const Content = styled.div`
  flex-grow: 1;
  display: flex;
  padding: 40px;
  flex-direction: column;
  overflow: auto;
  max-height: 100vh;
`
function DateTitle({ date }) {
  const Title = styled.h3`
    margin: 0;
    padding: 8px 0;
    position: sticky;
    top: 0;
    background-color: #fff;
    font-weight: 400;
    color: rgba(0, 0, 0, 0.56);
  `

  const isCurrentYear = new Date().getFullYear() === date.getFullYear()
  const formatString = isCurrentYear ? 'D MMMM, dd' : 'D MMMM YYYY, dd'
  const formattedDate = format(date, formatString, { locale: ru })
  return <Title>{formattedDate}</Title>
}

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
        return { ...{ date: monthMetrics }, ...metrics }
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
        <h1>Доход = {metricsTotal && metricsTotal.income}</h1>
        <h1>Расход = {metricsTotal && metricsTotal.outcome}</h1>
        {tags && tags.map(tag => <Tag tag={tag} key={tag.id} />)}
      </div>
    )
  }
}
