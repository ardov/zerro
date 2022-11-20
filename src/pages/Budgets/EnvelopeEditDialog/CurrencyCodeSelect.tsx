import React, { FC } from 'react'
import { useAppSelector } from '@store'
import { Select, MenuItem, SelectProps, ListItemText } from '@mui/material'
import { instrumentModel } from '@entities/currency/instrument'
import { getInBudgetAccounts } from '@entities/account'
import { TFxCode, TInstrument } from '@shared/types'
import { getCurrencySymbol } from '@shared/helpers/money'
import { userModel } from '@entities/user'

export const CurrencyCodeSelect: FC<SelectProps<TFxCode>> = props => {
  const instrumentsByCode = instrumentModel.useInstrumentsByCode()
  const userCurrency = userModel.useUserCurrency()
  const accs = useAppSelector(getInBudgetAccounts)
  const value = props.value

  const fxSet = new Set(accs.map(a => a.fxCode))
  fxSet.add(userCurrency)
  if (value) fxSet.add(value)
  const instruments = [...fxSet].map(code => instrumentsByCode[code])

  return (
    <Select {...props} renderValue={v => v}>
      {instruments.map(instr => (
        <MenuItem key={instr.shortTitle} value={instr.shortTitle}>
          <ListItemText
            primary={instr.shortTitle}
            secondary={describe(instr)}
          />
        </MenuItem>
      ))}
    </Select>
  )
}

function describe(i: TInstrument) {
  const symbol = getCurrencySymbol(i.shortTitle)
  if (symbol !== i.shortTitle) return `${i.title} (${symbol})`
  return i.title
}
