import React from 'react'
import TagSelect from 'components/TagSelect'
import {
  Drawer,
  Box,
  TextField,
  FormControlLabel,
  MenuItem,
  Switch,
  Grid,
  Tooltip,
  Typography,
  IconButton,
} from '@material-ui/core'
import CloseIcon from '@material-ui/icons/Close'

export default function FilterDrawer({
  conditions = {},
  setCondition,
  setTags,
  onClose,
  open,
  ...rest
}) {
  const handleTypeChange = e => {
    const value = e.target.value
    setCondition({ type: value || null })
  }

  return (
    <Drawer anchor="right" onClose={onClose} open={open} {...rest}>
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
      <Box px={2}>
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
          <TagSelect value={conditions.tags} onChange={setTags} />
        </Box>

        <Box mt={3}>
          <FormControlLabel
            control={
              <Switch
                checked={conditions.showDeleted}
                onChange={e => setCondition({ showDeleted: e.target.checked })}
                color="primary"
              />
            }
            label="Показывать удалённые"
          />
        </Box>
      </Box>
    </Drawer>
  )
}
