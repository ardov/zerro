import React, { FC } from 'react'
import Paper from '@material-ui/core/Paper'
import InputBase from '@material-ui/core/InputBase'
import IconButton from '@material-ui/core/IconButton'
import FilterListIcon from '@material-ui/icons/FilterList'
import { Tooltip } from 'components/Tooltip'
import CloseIcon from '@material-ui/icons/Close'
import FilterDrawer from './FilterDrawer'
import { useToggle } from 'helpers/useToggle'
import { FilterConditions } from 'store/localData/transactions/filtering'
import { SxProps } from '@material-ui/system'
import { Theme } from '@material-ui/core/styles'

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
