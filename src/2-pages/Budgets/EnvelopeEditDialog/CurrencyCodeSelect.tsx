import React, { FC } from 'react'
import { MenuItem, SelectProps, ListItemText } from '@mui/material'
import { instrumentModel } from '5-entities/currency/instrument'
import { accountModel } from '5-entities/account'
import { TFxCode, TInstrument } from '6-shared/types'
import { getCurrencySymbol } from '6-shared/helpers/money'
import { userModel } from '5-entities/user'
import { SmartSelect } from '6-shared/ui/SmartSelect'

export const CurrencyCodeSelect: FC<SelectProps<TFxCode>> = props => {
  const instrumentsByCode = instrumentModel.useInstrumentsByCode()
  const userCurrency = userModel.useUserCurrency()
  const accs = accountModel.useInBudgetAccounts()
  const value = props.value

  const fxSet = new Set(accs.map(a => a.fxCode))
  fxSet.add(userCurrency)
  if (value) fxSet.add(value)
  const instruments = [...fxSet].map(code => instrumentsByCode[code])

  return (
    <SmartSelect {...props} renderValue={v => v} elKey="CurrencyCodeSelect">
      {instruments.map(instr => (
        <MenuItem key={instr.shortTitle} value={instr.shortTitle}>
          <ListItemText
            primary={instr.shortTitle}
            secondary={describe(instr)}
          />
        </MenuItem>
      ))}
    </SmartSelect>
  )
}

function describe(i: TInstrument) {
  const symbol = getCurrencySymbol(i.shortTitle)
  if (symbol !== i.shortTitle) return `${i.title} (${symbol})`
  return i.title
}
