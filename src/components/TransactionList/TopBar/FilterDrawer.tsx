import React, { FC } from 'react'
import { TagSelect } from 'components/TagSelect'
import {
  Drawer,
  Box,
  TextField,
  FormControlLabel,
  MenuItem,
  Switch,
  Grid,
  Typography,
  IconButton,
  TextFieldProps,
} from '@mui/material'
import { DateRangePicker } from '@mui/lab'
import startOfDay from 'date-fns/startOfDay'
import endOfDay from 'date-fns/endOfDay'
import subMonths from 'date-fns/subMonths'

import { makeStyles } from '@mui/styles'
import { Tooltip } from 'components/Tooltip'
import { CloseIcon } from 'components/Icons'
import Button from '@mui/material/Button'

import { formatDate } from 'shared/helpers/format'
import { FilterConditions } from 'store/data/transactions/filtering'
import { TrType } from 'types'

const useStyles = makeStyles(theme => ({
  drawerWidth: {
    width: 360,
    [theme.breakpoints.down('sm')]: {
      width: '100vw',
    },
  },
}))

type FilterDrawerProps = {
  setCondition: (c: FilterConditions) => void
  conditions: FilterConditions
  clearFilter: () => void
  onClose: () => void
  open: boolean
}

const FilterDrawer: FC<FilterDrawerProps> = ({
  conditions = {},
  setCondition,
  clearFilter,
  onClose,
  open,
  ...rest
}) => {
  const c = useStyles()
  const handleTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value as TrType
    setCondition({ type: value || null })
  }

  return (
    <Drawer
      anchor="right"
      onClose={onClose}
      open={open}
      classes={{ paper: c.drawerWidth, root: c.drawerWidth }}
      {...rest}
    >
      <Box py={1} px={2} display="flex" alignItems="center">
        <Box flexGrow={1}>
          <Typography variant="h6" noWrap>
            Фильтр
          </Typography>
        </Box>

        <Tooltip title="Закрыть">
          <IconButton edge="end" onClick={onClose} children={<CloseIcon />} />
        </Tooltip>
      </Box>
      <Box px={2} flex="1" display="flex" flexDirection="column">
        <TextField
          id="search-input"
          label="Поиск по комментариям"
          value={conditions.search || ''}
          onChange={e => setCondition({ search: e.target.value })}
          variant="outlined"
          fullWidth
        />

        <Box mt={3} display="flex">
          <Grid container spacing={3}>
            <Grid item xs={6}>
              <TextField
                variant="outlined"
                label="Сумма от"
                value={conditions.amountFrom || ''}
                onChange={e => setCondition({ amountFrom: +e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                variant="outlined"
                label="Сумма до"
                value={conditions.amountTo || ''}
                onChange={e => setCondition({ amountTo: +e.target.value })}
              />
            </Grid>
          </Grid>
        </Box>

        <Box mt={3} display="flex">
          <DateRangePicker
            startText="Дата от"
            endText="Дата до"
            mask="__.__.____"
            value={[conditions.dateFrom || null, conditions.dateTo || null]}
            maxDate={endOfDay(new Date())}
            defaultCalendarMonth={subMonths(new Date(), 1)}
            onChange={([dateFrom, dateTo]: [
              number | Date | undefined,
              number | Date | undefined
            ]) => {
              setCondition({
                dateFrom: dateFrom && +startOfDay(dateFrom),
                dateTo: dateTo && +endOfDay(dateTo),
              })
            }}
            renderInput={(
              startProps: TextFieldProps,
              endProps: TextFieldProps
            ) => (
              <Grid container spacing={3}>
                <Grid item xs={6}>
                  <TextField {...startProps} />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    {...endProps}
                    inputProps={{
                      ...endProps.inputProps,
                      placeholder: formatDate(new Date(), 'dd.MM.yyyy'),
                    }}
                  />
                </Grid>
              </Grid>
            )}
          />
        </Box>
        <Box mt={3}>
          <TextField
            select
            variant="outlined"
            value={conditions.type || ''}
            onChange={handleTypeChange}
            label="Тип транзакции"
            fullWidth
          >
            <MenuItem value="">Все</MenuItem>
            <MenuItem value="income">Доход</MenuItem>
            <MenuItem value="outcome">Расход</MenuItem>
            <MenuItem value="transfer">Перевод</MenuItem>
          </TextField>
        </Box>

        <Box mt={3}>
          <TagSelect
            multiple
            tagFilters={{ includeNull: true }}
            value={conditions.tags || []}
            onChange={tags =>
              setCondition({ tags: tags as FilterConditions['tags'] })
            }
          />
        </Box>

        <Box mt={3}>
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(conditions.isNew)}
                onChange={e =>
                  setCondition({ isNew: e.target.checked || undefined })
                }
                color="primary"
              />
            }
            label="Только новые"
          />
        </Box>

        <Box mt={3}>
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(conditions.showDeleted)}
                onChange={e =>
                  setCondition({ showDeleted: e.target.checked || undefined })
                }
                color="primary"
              />
            }
            label="Показывать удалённые"
          />
        </Box>
        <Box mt="auto" mb={3}>
          <Button
            onClick={clearFilter}
            variant="contained"
            fullWidth
            color="primary"
          >
            Очистить фильтры
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

export default FilterDrawer
