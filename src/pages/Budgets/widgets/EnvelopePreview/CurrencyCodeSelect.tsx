import React, { FC } from 'react'
import { useAppSelector } from 'store'
import { Select, MenuItem, SelectProps } from '@mui/material'
import {
  getInstruments,
  getInstrumentsByCode,
  getUserCurrencyCode,
} from 'models/instrument'
import { getAccountList } from 'models/account'
import { TFxCode } from 'shared/types'

export const CurrencyCodeSelect: FC<SelectProps<TFxCode>> = props => {
  const instrumentsById = useAppSelector(getInstruments)
  const instrumentsByCode = useAppSelector(getInstrumentsByCode)
  const userCurrency = useAppSelector(getUserCurrencyCode)
  const accounts = useAppSelector(getAccountList)
  const value = props.value
  let shortList = accounts.map(a => instrumentsById[a.instrument].shortTitle)

  shortList = [userCurrency, ...shortList]
  if (value) {
    shortList = [value, ...shortList]
  }
  const list = shortList
    .filter((v, i, a) => a.indexOf(v) === i)
    .map(code => instrumentsByCode[code]) // unique instruments

  return (
    <Select {...props}>
      {list.map(instr => (
        <MenuItem key={instr.shortTitle} value={instr.shortTitle}>
          {instr.title} ({instr.symbol})
        </MenuItem>
      ))}
    </Select>
  )
}
