import React, { FC } from 'react'
import { TagSelect } from '@components/TagSelect'
import {
  Drawer,
  Box,
  TextField,
  FormControlLabel,
  MenuItem,
  Switch,
  Grid,
  Typography,
  Button,
  IconButton,
  SelectChangeEvent,
  FormControl,
  InputLabel,
} from '@mui/material'
import { Tooltip } from '@shared/ui/Tooltip'
import { CloseIcon } from '@shared/ui/Icons'
import { FilterConditions } from '@entities/transaction/filtering'
import { TrType } from '@entities/transaction'
import { SmartSelect } from '@shared/ui/SmartSelect'

const drawerWidth = { xs: '100vw', sm: 360 }
const contentSx = {
  width: drawerWidth,
  [`& .MuiDrawer-paper`]: { width: drawerWidth },
}

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
  const handleTypeChange = (e: SelectChangeEvent<string>) => {
    const value = e.target.value as TrType
    setCondition({ type: value || null })
  }

  return (
    <Drawer
      anchor="right"
      onClose={onClose}
      open={open}
      sx={contentSx}
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

        {/* <Box mt={3} display="flex">
          <DateRangePicker
            startText="Дата от"
            endText="Дата до"
            mask="__.__.____"
            value={[conditions.dateFrom || null, conditions.dateTo || null]}
            maxDate={endOfDay(new Date())}
            defaultCalendarMonth={prevMonth(new Date())}
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
        </Box> */}
        <Box mt={3}>
          <FormControl fullWidth>
            <InputLabel>Тип транзакции</InputLabel>
            <SmartSelect
              elKey="transactionType"
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
            </SmartSelect>
          </FormControl>
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
