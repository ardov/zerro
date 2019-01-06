import React from 'react'
import styled from 'styled-components'

export const BarChart = ({ amounts = [], color = '#000' }) => {
  const Body = styled.div`
    display: flex;
    flex-direction: row;
    height: 40px;
  `
  const Month = styled.div`
    flex-grow: 1;
    display: flex;
    padding: 4px;
    height: 40px;
  `
  const Bar = styled.div`
    height: ${props => props.percent}%;
    background-color: #000;
    min-height: 1px;
    min-width: 8px;
    align-self: flex-end;
    border-radius: 2px;
  `

  const max = Math.max(...amounts)

  return (
    <Body>
      {amounts.map(sum => (
        <Month>
          <Bar percent={(sum / max) * 100} />
        </Month>
      ))}
    </Body>
  )
}
