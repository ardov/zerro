import React from 'react'
import styled from 'styled-components'
import { Bar } from 'react-chartjs-2'

const Body = styled.div`
  margin: -10px;
  /* flex-grow: 1; */
  min-width: 3000px;
`

const options = {
  // events: ['click'],
  tooltips: {
    intersect: false,
    backgroundColor: 'white',
    titleFontColor: '#000',
    bodyFontColor: '#000',
    custom: w => {
      console.log('rrrrr', w)
    }
  },
  maintainAspectRatio: false,
  layout: {
    padding: { top: 0, left: 0, right: 0, bottom: 0 }
  },
  legend: { display: false },
  title: { display: false },
  hover: { intersect: false, animationDuration: 0 },
  scales: {
    yAxes: [
      {
        gridLines: { display: false, drawBorder: false },
        scaleLabel: { display: false },
        ticks: { display: false, mirror: true }
      }
    ],
    xAxes: [
      {
        gridLines: { display: false, drawBorder: true },
        scaleLabel: { display: false },
        ticks: { display: false, mirror: true },
        barThickness: 10,
        barPercentage: 1,
        categoryPercentage: 0.9
      }
    ]
  }
}

export const BarChart = ({ data = [], maxValue, barColor = '#000' }) => {
  console.log('DATAAAA', data)

  const barData = {
    labels: data.map(el => el.title),
    datasets: [
      {
        // label: 'My First dataset',
        backgroundColor: 'rgba(0,0,0,0.2)',
        // borderColor: 'rgba(255,99,132,1)',
        borderWidth: 0,
        hoverBackgroundColor: 'rgba(255,99,132,0.4)',
        hoverBorderColor: 'rgba(255,99,132,1)',
        data: data.map(el => el.sum)
      }
    ]
  }

  return (
    <Body>
      <Bar
        data={barData}
        // width={10}
        height={60}
        options={options}
        getElementAtEvent={elem => {
          console.log(elem)
        }}
      />
    </Body>
  )
}
