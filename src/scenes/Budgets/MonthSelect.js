import React from 'react'
import { Button } from 'antd'
import { format } from 'date-fns'
import ru from 'date-fns/locale/ru'
import styled from 'styled-components'

const getMonthName = date =>
  format(date, 'MMMM YYYY', { locale: ru }).toUpperCase()

const Group = styled(Button.Group)`
  display: flex;
`
const Name = styled(Button)`
  flex-grow: 1;
  text-align: left;
`

export default function MonthSelect({ months, current, onChange }) {
  const currentMonth = months[current]
  return (
    <Group size="large">
      <Name onClick={() => onChange(++current)}>
        {getMonthName(currentMonth)}
      </Name>
      <Button
        icon="left"
        onClick={() => onChange(--current)}
        disabled={!current}
      />
      <Button
        icon="right"
        onClick={() => onChange(++current)}
        disabled={current >= months.length - 1}
      />
    </Group>
  )
}
