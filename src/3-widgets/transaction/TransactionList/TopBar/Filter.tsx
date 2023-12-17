import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import Paper from '@mui/material/Paper'
import InputBase from '@mui/material/InputBase'
import { SxProps } from '@mui/system'
import { Theme } from '@mui/material/styles'
import IconButton from '@mui/material/IconButton'
import { FilterListIcon, CloseIcon } from '6-shared/ui/Icons'
import { Tooltip } from '6-shared/ui/Tooltip'
import { useToggle } from '6-shared/hooks/useToggle'
import { TrCondition } from '5-entities/transaction'
import FilterDrawer from './FilterDrawer'

type FilterProps = {
  setCondition: (c: TrCondition) => void
  conditions?: TrCondition
  clearFilter: () => void
  sx?: SxProps<Theme>
}
const Filter: FC<FilterProps> = ({
  setCondition,
  conditions = {},
  clearFilter,
  sx,
}) => {
  const { t } = useTranslation('filterDrawer')
  const [isDrawerVisible, toggleDrawer] = useToggle(false)
  const isFiltered = Object.values(conditions).filter(Boolean).length > 0

  return (
    <Paper
      elevation={10}
      sx={{ display: 'flex', alignItems: 'center', px: 2, ...sx }}
    >
      <InputBase
        value={conditions.search || ''}
        placeholder={t('searchComments')}
        onChange={e => setCondition({ search: e.target.value })}
        sx={{ flexGrow: 1 }}
      />

      {!!conditions.search && (
        <Tooltip title={t('clearField')}>
          <IconButton
            onClick={() => setCondition({ search: '' })}
            children={<CloseIcon />}
          />
        </Tooltip>
      )}

      <Tooltip title={t('extendedFilters')}>
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
