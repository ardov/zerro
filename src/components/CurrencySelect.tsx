import React, { FC } from 'react'
import { useSelector } from 'react-redux'
import { Select, MenuItem, SelectProps } from '@mui/material'
import { getInstruments } from 'store/data/instruments'
import { getAccountList } from 'store/data/accounts'

export const CurrencySelect: FC<SelectProps<number>> = props => {
  const instruments = useSelector(getInstruments)
  const accounts = useSelector(getAccountList)
  const shortList = accounts
    .map(a => a.instrument)
    .filter((v, i, a) => a.indexOf(v) === i) // unique instruments
    .map(id => instruments[id])

  const value = props.value
  const valueInList = !!shortList.find(instr => instr.id === value)

  return (
    <Select {...props}>
      {!valueInList && value && (
        <MenuItem value={value}>
          {instruments[value]?.title} ({instruments[value]?.symbol})
        </MenuItem>
      )}
      {shortList.map(instr => (
        <MenuItem key={instr.id} value={instr.id}>
          {instr.title} ({instr.symbol})
        </MenuItem>
      ))}
    </Select>
  )
}
