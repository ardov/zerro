import type { FC } from 'react'
import { core } from '@/zerro-core/redux'

import type { TFxCode } from '@/6-shared/types'
import { CurrencyCodeSelect as CurrencySelect } from '@/3-widgets/currency/CurrencyCodeSelect'

type CurrencyCodeSelectProps = {
  value: TFxCode
  onChange: (value: TFxCode) => void
  label: string
  className?: string
}

export const CurrencyCodeSelect: FC<CurrencyCodeSelectProps> = props => {
  const { value, onChange, ...rest } = props
  const userCurrency = core.users.useCurrency()
  const accs = core.accounts.useInBudget()

  const fxSet = new Set(accs.map(a => a.fxCode))
  fxSet.add(userCurrency)
  if (value) fxSet.add(value)

  return (
    <CurrencySelect
      {...rest}
      required
      value={value}
      labelMode="floating"
      onChange={onChange}
      currencies={[...fxSet]}
    />
  )
}
