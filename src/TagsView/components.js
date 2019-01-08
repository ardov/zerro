import React from 'react'
import styled from 'styled-components'
import { Popover } from 'antd'

export const BarChart = ({ data = [], maxValue, barColor = '#000' }) => {
  const Body = styled.div`
    display: flex;
    flex-direction: row;
    height: 40px;
  `
  const BarContainer = styled.div`
    flex-grow: 1;
    display: flex;
    padding: 4px;
    height: 40px;

    &:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }
  `
  const Bar = styled.div`
    height: ${props => props.percent}%;
    background-color: #000;
    min-height: 1px;
    min-width: 8px;
    align-self: flex-end;
    border-radius: 2px;
  `

  const max = maxValue ? maxValue : Math.max(...data.map(el => el.sum))

  return (
    <Body>
      {data.map(el => (
        <Popover content={el.content} title={el.title} key={+el.date}>
          <BarContainer>
            <Bar percent={(el.sum / max) * 100} />
          </BarContainer>
        </Popover>
      ))}
    </Body>
  )
}
