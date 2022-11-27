import React, { FC } from 'react'
import { Select, MenuItem, SelectProps } from '@mui/material'
import { instrumentModel } from '@entities/currency/instrument'
import { accountModel } from '@entities/account'

export const CurrencySelect: FC<SelectProps<number>> = props => {
  const instruments = instrumentModel.useInstruments()
  const accounts = accountModel.useAccountList()
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
