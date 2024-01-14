import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
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
import { Tooltip } from '6-shared/ui/Tooltip'
import { CloseIcon } from '6-shared/ui/Icons'
import { SmartSelect } from '6-shared/ui/SmartSelect'
import { TagSelect } from '5-entities/tag/ui/TagSelect'
import { TrCondition } from '5-entities/transaction'
import { TrType } from '5-entities/transaction'

const drawerWidth = { xs: '100vw', sm: 360 }
const contentSx = {
  width: drawerWidth,
  [`& .MuiDrawer-paper`]: { width: drawerWidth },
}

type FilterDrawerProps = {
  setCondition: (c: TrCondition) => void
  conditions: TrCondition
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
  const { t } = useTranslation('filterDrawer')
  const handleTypeChange = (e: SelectChangeEvent<string>) => {
    const value = e.target.value as TrType
    setCondition({ type: value || null })
  }

  const { gte, lte } = getGteLte(conditions.amount)

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
            {t('filter')}
          </Typography>
        </Box>

        <Tooltip title={t('close')}>
          <IconButton edge="end" onClick={onClose} children={<CloseIcon />} />
        </Tooltip>
      </Box>
      <Box px={2} flex="1" display="flex" flexDirection="column">
        <TextField
          id="search-input"
          label={t('searchComments')}
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
                label={t('amountFrom')}
                value={gte}
                onChange={e =>
                  setCondition({ amount: { lte, gte: +e.target.value } })
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                variant="outlined"
                label={t('amountTo')}
                value={lte}
                onChange={e =>
                  setCondition({ amount: { gte, lte: +e.target.value } })
                }
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
            <InputLabel>{t('transactionType')}</InputLabel>
            <SmartSelect
              elKey="transactionType"
              variant="outlined"
              value={typeof conditions.type === 'string' ? conditions.type : ''}
              onChange={handleTypeChange}
              label={t('transactionType')}
              fullWidth
            >
              <MenuItem value="">{t('transactionType_all')}</MenuItem>
              <MenuItem value={TrType.Income}>
                {t('transactionType_income')}
              </MenuItem>
              <MenuItem value={TrType.Outcome}>
                {t('transactionType_outcome')}
              </MenuItem>
              <MenuItem value={TrType.Transfer}>
                {t('transactionType_transfer')}
              </MenuItem>
            </SmartSelect>
          </FormControl>
        </Box>

        <Box mt={3}>
          <TagSelect
            multiple
            tagFilters={{ includeNull: true }}
            value={conditions.tags || []}
            onChange={tags =>
              setCondition({ tags: tags as TrCondition['tags'] })
            }
          />
        </Box>

        <Box mt={3}>
          <FormControlLabel
            label={t('onlyNew')}
            control={
              <Switch
                color="primary"
                checked={conditions.isViewed === false}
                onChange={e => {
                  if (e.target.checked) setCondition({ isViewed: false })
                  else setCondition({ isViewed: undefined })
                }}
              />
            }
          />
        </Box>

        <Box mt={3}>
          <FormControlLabel
            label={t('showDeleted')}
            control={
              <Switch
                checked={Boolean(conditions.showDeleted)}
                onChange={e =>
                  setCondition({ showDeleted: e.target.checked || undefined })
                }
                color="primary"
              />
            }
          />
        </Box>
        <Box mt="auto" mb={3}>
          <Button
            onClick={clearFilter}
            variant="contained"
            fullWidth
            color="primary"
          >
            {t('clearFilter')}
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

export default FilterDrawer

function getGteLte(amount: TrCondition['amount']) {
  if (amount === undefined || amount === null)
    return { gte: undefined, lte: undefined }
  if (typeof amount === 'number') return { gte: amount, lte: amount }
  if (typeof amount === 'object')
    return {
      gte: amount.gte === undefined ? undefined : +amount.gte,
      lte: amount.lte === undefined ? undefined : +amount.lte,
    }
  return { gte: undefined, lte: undefined }
}
