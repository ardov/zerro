import React, { Component } from 'react'
import styled from 'styled-components'
import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'
import { BarChart } from './components'

const Body = styled.div`
  display: flex;
  flex-direction: row;
`

const Title = styled.div`
  width: 200px;
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

export default class Tag extends Component {
  render() {
    const { tag } = this.props
    const amounts = tag.metricsByMonths
      ? tag.metricsByMonths.map(m => m.outcome)
      : []

    return (
      <Body
        onClick={() => {
          console.log(tag)
        }}
      >
        <Title>{tag.title}</Title>
        <BarChart amounts={amounts} />
      </Body>
    )
  }
}
