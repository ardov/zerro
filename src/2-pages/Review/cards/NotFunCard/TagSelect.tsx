import { useTranslation } from 'react-i18next'
import Checkbox from '@mui/material/Checkbox'
import { formatMoney } from '6-shared/helpers/money'
import type { TTagId } from '6-shared/types'
import { MultiSelect, SelectItem, SelectItemText } from '6-shared/ui/Select'

type TagSelectProps = {
  options: { id: TTagId; name: string; amount: number }[]
  onChange: (opts: TTagId[]) => void
  selected: TTagId[]
  label: string
}

export function TagSelect(props: TagSelectProps) {
  const { t } = useTranslation('common')
  const { options, onChange, selected, label } = props
  const renderText = (selected: TagSelectProps['selected']) => {
    if (selected.length === 1) {
      const opt = options.find(opt => opt.id === selected[0])
      if (opt?.name) return opt.name
    }
    return t('tagSelected', { count: selected.length })
  }

  return (
    <MultiSelect
      elKey="TagSelect"
      className="w-[300px]"
      label={label}
      value={selected}
      onChange={next => onChange(next as TTagId[])}
      renderValue={renderText}
    >
      {options
        .filter(t => t.amount)
        .map(tag => (
          // The row carries its own checkbox, so no tick beside it.
          <SelectItem key={tag.id} value={tag.id}>
            <Checkbox checked={selected.includes(tag.id)} tabIndex={-1} />
            <SelectItemText>
              {`${tag.name} (${formatMoney(tag.amount)})`}
            </SelectItemText>
          </SelectItem>
        ))}
    </MultiSelect>
  )
}
