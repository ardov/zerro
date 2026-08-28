import type { FC } from 'react'
import { core } from 'zerro-core/redux'

import type { TFxCode, TInstrument } from '6-shared/types'
import { getCurrencySymbol } from '6-shared/helpers/money'
import { Select } from '6-shared/ui/Select'

type CurrencyCodeSelectProps = {
  value: TFxCode
  onChange: (value: TFxCode) => void
  label?: string
  className?: string
}

export const CurrencyCodeSelect: FC<CurrencyCodeSelectProps> = props => {
  const { value, onChange, ...rest } = props
  const instrumentsByCode = core.instruments.useByCode()
  const userCurrency = core.users.useCurrency()
  const accs = core.accounts.useInBudget()

  const fxSet = new Set(accs.map(a => a.fxCode))
  fxSet.add(userCurrency)
  if (value) fxSet.add(value)
  const instruments = [...fxSet].map(code => instrumentsByCode[code])

  return (
    <Select
      {...rest}
      value={value}
      onChange={onChange}
      // The closed field shows the code alone; the rows carry the full name.
      options={instruments.map(instr => ({
        value: instr.shortTitle,
        label: instr.shortTitle,
        description: describe(instr),
      }))}
    />
  )
}

function describe(i: TInstrument) {
  const symbol = getCurrencySymbol(i.shortTitle)
  if (symbol !== i.shortTitle) return `${i.title} (${symbol})`
  return i.title
}
