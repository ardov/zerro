import React, { FC, useState } from 'react'
import Paper from '@mui/material/Paper'
import InputBase from '@mui/material/InputBase'
import IconButton from '@mui/material/IconButton'
import FilterListIcon from '@mui/icons-material/FilterList'
import { Tooltip } from 'components/Tooltip'
import CloseIcon from '@mui/icons-material/Close'
import { useToggle } from 'helpers/useToggle'
import { FilterConditions } from 'store/localData/transactions/filtering'
import { Box, SxProps } from '@mui/system'
import { Theme } from '@mui/material/styles'
import {
  Button,
  InputAdornment,
  MenuItem,
  MenuList,
  Popover,
  Stack,
  TextField,
} from '@mui/material'
import { isNull } from 'lodash'

type FilterRuleProps = {
  condition?: FilterConditions
  onSubmit: (v: FilterConditions) => void
  onCancel: () => void
  onDelete: () => void
}

const AmountFilter: FC<FilterRuleProps> = props => {
  const { condition = {}, onSubmit, onCancel, onDelete } = props
  const { amountFrom, amountTo } = condition
  const [from, setFrom] = useState(amountFrom)
  const [to, setTo] = useState(amountTo)
  const apply = () => {
    let condition: FilterConditions = {}
    if (from) condition.amountFrom = from
    if (to) condition.amountTo = to
    onSubmit(condition)
  }
  return (
    <Stack p={2} spacing={2}>
      <Box>Сумма</Box>
      <TextField
        value={from || ''}
        onChange={e => setFrom(+e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start" component="label">
              От
            </InputAdornment>
          ),
        }}
      />
      <TextField
        value={to || ''}
        onChange={e => setTo(+e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start" component="label">
              До
            </InputAdornment>
          ),
        }}
      />
      <Button variant="contained" onClick={apply}>
        Применить
      </Button>
    </Stack>
  )
}
const CommentFilter: FC<FilterRuleProps> = props => {
  return <div>This is Comment Filter</div>
}

export type FilterProps = {
  sx?: SxProps<Theme>
  conditions?: FilterConditions
  onConditionChange: (c: FilterConditions) => void
}

export const Filter: FC<FilterProps> = ({
  sx,
  conditions = {},
  onConditionChange,
}) => {
  const [selected, setSelected] = useState<number | null>(null)

  const filters = [
    { name: 'Сумма', component: AmountFilter },
    { name: 'Комментарий', component: CommentFilter },
  ]

  // const Component = isNull(selected) ? undefined :

  const renderFilter = (id = 0) => {
    const Component = filters[id].component
    return (
      <Component onSubmit={() => {}} onCancel={() => {}} onDelete={() => {}} />
    )
  }

  return (
    <Paper
      elevation={2}
      sx={{ display: 'flex', alignItems: 'center', px: 2, ...sx }}
    >
      <InputBase
        value={conditions.search || ''}
        placeholder="Поиск по комментариям"
        onChange={e => onConditionChange({ search: e.target.value })}
        sx={{ flexGrow: 1 }}
      />

      {!!conditions.search && (
        <Tooltip title="Очистить поле">
          <IconButton
            onClick={() => onConditionChange({ search: '' })}
            children={<CloseIcon />}
          />
        </Tooltip>
      )}

      <Tooltip title="Расширенные фильтры">
        <IconButton
          edge="end"
          color={'primary'}
          onClick={() => {}}
          children={<FilterListIcon />}
        />
      </Tooltip>

      <Popover open={true}>
        {isNull(selected) ? (
          <MenuList>
            {filters.map((v, i) => (
              <MenuItem key={i} onClick={() => setSelected(i)}>
                {v.name}
              </MenuItem>
            ))}
          </MenuList>
        ) : (
          <Stack>
            <button onClick={() => setSelected(null)}>Back</button>
            {renderFilter(selected)}
          </Stack>
        )}
      </Popover>
      {/* <Menu open={true}>
        {filters.map((v, i) => (
          <MenuItem key={i} onClick={() => setSelected(i)}>
            {v.name}
          </MenuItem>
        ))}
      </Menu> */}
    </Paper>
  )
}
