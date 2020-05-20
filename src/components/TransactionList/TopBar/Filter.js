import React from 'react'
import Paper from '@material-ui/core/Paper'
import InputBase from '@material-ui/core/InputBase'
import IconButton from '@material-ui/core/IconButton'
import FilterListIcon from '@material-ui/icons/FilterList'
import { Tooltip } from 'components/Tooltip'
import Box from '@material-ui/core/Box'
import CloseIcon from '@material-ui/icons/Close'

import FilterDrawer from './FilterDrawer.js'

export default function Filter({ setCondition, conditions = {}, ...rest }) {
  const [isDrawerVisible, setDrawerVisible] = React.useState(false)
  const toggleDrawer = () => setDrawerVisible(!isDrawerVisible)

  return (
    <Box display="flex" alignItems="center" px={2} {...rest} clone>
      <Paper elevation={10}>
        <Box flexGrow={1} clone>
          <InputBase
            value={conditions.search || ''}
            placeholder="Поиск по комментариям"
            onChange={e => setCondition({ search: e.target.value })}
          />
        </Box>

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
            onClick={toggleDrawer}
            children={<FilterListIcon />}
          />
        </Tooltip>

        <FilterDrawer
          onClose={toggleDrawer}
          open={isDrawerVisible}
          {...{ conditions, setCondition }}
        />
      </Paper>
    </Box>
  )
}
