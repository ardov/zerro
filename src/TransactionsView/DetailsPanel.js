import React from 'react'
import { StoreContext } from '../Store'
import styled, { css } from 'styled-components'
import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'
import { FormattedNumber } from 'react-intl'

const formatDate = date => format(date, 'D MMMM YYYY, dd', { locale: ru })
const formatDateTime = date =>
  format(date, 'D MMMM YYYY, dd, HH:mm:ss', { locale: ru })

const Body = styled.section`
  border-left: 1px solid #eee;
  min-width: 400px;
  display: flex;
  flex-direction: column;
  padding: 40px;
`

const Line = ({ name, value }) => {
  const Body = styled.div`
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: row;
    padding: 8px 0;
  `
  const Name = styled.div`
    flex-shrink: 0;
    width: 200px;
  `
  const Value = styled.div`
    flex-grow: 1;
    margin-left: 8px;
  `
  return (
    <Body>
      <Name>{name}</Name>
      <Value>{value}</Value>
    </Body>
  )
}

export default class DetailsPanel extends React.Component {
  static contextType = StoreContext

  render() {
    const { deleteTransaction, getElement } = this.context.actions
    const tr = getElement('transaction', this.context.data.openedTransaction)
    console.log(tr)

    const values = tr
      ? [
          {
            name: 'ID',
            value: tr.id
          },
          {
            name: 'Дата',
            value: formatDate(tr.date)
          },
          {
            name: 'Создана',
            value: formatDateTime(tr.created)
          },
          {
            name: 'Последнее изменение',
            value: formatDateTime(tr.changed)
          },
          {
            name: 'Доход',
            value: (
              <FormattedNumber
                value={tr.income}
                style={`currency`}
                currency={tr.incomeInstrument.shortTitle}
                minimumFractionDigits={0}
                maximumFractionDigits={0}
              />
            )
          },
          {
            name: 'На счёт',
            value: tr.incomeAccount.title
          },
          {
            name: 'Расход',
            value: (
              <FormattedNumber
                value={tr.outcome}
                style={`currency`}
                currency={tr.outcomeInstrument.shortTitle}
                minimumFractionDigits={0}
                maximumFractionDigits={0}
              />
            )
          },
          {
            name: 'Со счёта',
            value: tr.outcomeAccount.title
          }
        ]
      : null

    return (
      <Body>
        {tr && (
          <div>
            {values.map(el => (
              <Line name={el.name} value={el.value} key={el.name} />
            ))}
            <button
              onClick={() => {
                deleteTransaction(tr.id)
              }}
            >
              Delete
            </button>
            <button
              onClick={() => {
                console.log(tr)
              }}
            >
              Log Transaction
            </button>
          </div>
        )}
      </Body>
    )
  }
}
