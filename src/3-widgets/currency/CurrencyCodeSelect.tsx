import { core } from '@/zerro-core/redux'
import { getCurrencySymbol } from '@/6-shared/helpers/money'
import { Select, type SelectProps } from '@/6-shared/ui/kit/Select'

type CurrencyCodeSelectProps = Omit<
  SelectProps,
  'items' | 'onChange' | 'required' | 'clearable'
> & {
  currencies: readonly string[]
} & (
    | { required: true; onChange: (value: string) => void }
    | { required?: false; onChange: (value: string | null) => void }
  )

/** Callers choose the available currencies; their presentation is shared. */
export function CurrencyCodeSelect({
  currencies,
  ...props
}: CurrencyCodeSelectProps) {
  const instruments = core.instruments.useByCode()
  return (
    <Select
      {...props}
      items={currencies.map(code => {
        const instrument = instruments[code]
        const symbol = getCurrencySymbol(code)
        return {
          value: code,
          label: code,
          description: instrument
            ? `${instrument.title}${symbol !== code ? ` (${symbol})` : ''}`
            : undefined,
          keywords: instrument ? [instrument.title, symbol] : [symbol],
        }
      })}
    />
  )
}
