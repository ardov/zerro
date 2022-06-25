import React, { FC } from 'react'
import Paper from '@mui/material/Paper'
import InputBase from '@mui/material/InputBase'
import IconButton from '@mui/material/IconButton'
import { FilterListIcon, CloseIcon } from 'shared/ui/Icons'
import { Tooltip } from 'shared/ui/Tooltip'
import FilterDrawer from './FilterDrawer'
import { useToggle } from 'shared/hooks/useToggle'
import { FilterConditions } from 'models/data/transactions/filtering'
import { SxProps } from '@mui/system'
import { Theme } from '@mui/material/styles'

type FilterProps = {
  setCondition: (c: FilterConditions) => void
  conditions?: FilterConditions
  clearFilter: () => void
  sx?: SxProps<Theme>
}
const Filter: FC<FilterProps> = ({
  setCondition,
  conditions = {},
  clearFilter,
  sx,
}) => {
  const [isDrawerVisible, toggleDrawer] = useToggle(false)
  const isFiltered = Object.values(conditions).filter(Boolean).length > 0

  return (
    <Paper
      elevation={10}
      sx={{ display: 'flex', alignItems: 'center', px: 2, ...sx }}
    >
      <InputBase
        value={conditions.search || ''}
        placeholder="Поиск по комментариям"
        onChange={e => setCondition({ search: e.target.value })}
        sx={{ flexGrow: 1 }}
      />

      {!!conditions.search && (
        <Tooltip title="Очистить поле">
          <IconButton
            onClick={() => setCondition({ search: '' })}
            children={<CloseIcon />}
          />
        </Tooltip>
      )}

      <Tooltip title="Расширенные фильтры">
        <IconButton
          edge="end"
          color={isFiltered ? 'secondary' : 'primary'}
          onClick={toggleDrawer}
          children={<FilterListIcon />}
        />
      </Tooltip>

      <FilterDrawer
        onClose={toggleDrawer}
        open={isDrawerVisible}
        {...{ conditions, setCondition, clearFilter }}
      />
    </Paper>
  )
}

export default Filter
