import React from 'react'
import {
  Checkbox,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
} from '@mui/material'
import pluralize from '6-shared/helpers/pluralize'
import { formatMoney } from '6-shared/helpers/money'
import { TTagId } from '6-shared/types'

type TagSelectProps = {
  options: { id: TTagId; name: string; amount: number }[]
  onChange: (opts: TTagId[]) => void
  selected: TTagId[]
  label: string
}

// TODO: i18n
export function TagSelect(props: TagSelectProps) {
  let { options, onChange, selected, label } = props
  let renderText = (selected: TagSelectProps['selected']) => {
    return selected.length === 0
      ? 'Ничего не выбрано'
      : selected.length === 1
      ? options.find(opt => opt.id === selected[0])?.name || '1'
      : selected.length +
        ' ' +
        pluralize(selected.length, ['категория', 'категории', 'категорий'])
  }

  return (
    <FormControl sx={{ width: 300 }}>
      <InputLabel>{label}</InputLabel>
      <Select
        multiple
        value={selected}
        onChange={e => {
          let v = e.target.value
          onChange(typeof v === 'string' ? v.split(',') : v)
        }}
        input={<OutlinedInput label={label} />}
        renderValue={renderText}
      >
        {options
          .filter(t => t.amount)
          .map(tag => (
            <MenuItem key={tag.id} value={tag.id}>
              <Checkbox checked={selected.includes(tag.id)} />
              <ListItemText
                primary={`${tag.name} (${formatMoney(tag.amount)})`}
              />
            </MenuItem>
          ))}
      </Select>
    </FormControl>
  )
}
