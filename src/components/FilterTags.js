import React, { Component } from 'react'
import styled from 'styled-components'
import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'

import { StoreContext } from '../store/'
// import { defaultConditions } from '../TransactionFilter/'
// import { FormattedNumber } from 'react-intl'
import { Tag } from 'antd'

const formatDate = date => format(date, 'D MMM YYYY', { locale: ru })

export default class FilterTags extends Component {
  static contextType = StoreContext
  render() {
    const conditions = this.props.conditions

    const {
      // search,
      type,
      // showDeleted,
      fromDate,
      toDate
      // tags,
      // accounts,
      // amountFrom,
      // amountTo
    } = conditions

    const types = {
      income: 'Доход',
      outcome: 'Расход',
      transfer: 'Перевод'
    }

    const Body = styled.div`
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
    `

    return (
      <Body>
        {type && (
          <Tag color="blue" closable>
            {types[type]}
          </Tag>
        )}
        {fromDate && (
          <Tag color="blue" closable>
            с {formatDate(fromDate)}
          </Tag>
        )}
        {toDate && (
          <Tag color="blue" closable>
            по {formatDate(toDate)}
          </Tag>
        )}
      </Body>
    )
  }
}
