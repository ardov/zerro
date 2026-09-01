import { useTranslation } from 'react-i18next'
import { formatMoney } from '@/6-shared/helpers/money'
import type { TTagId } from '@/6-shared/types'
import { MultiSelect } from '@/6-shared/ui/Select'

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
      className="w-[300px]"
      label={label}
      value={selected}
      onChange={onChange}
      renderValue={renderText}
      options={options
        .filter(tag => tag.amount)
        .map(tag => ({
          value: tag.id,
          label: `${tag.name} (${formatMoney(tag.amount)})`,
        }))}
    />
  )
}
