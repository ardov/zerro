import React, { FC } from 'react'
// import { useSelector } from 'react-redux'
// import { getPopulatedTags } from 'store/localData/tags'
import {
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  InputAdornment,
  Stack,
  TextField,
} from '@mui/material'
import { TagSelect } from './TagSelect'
import { Box } from '@mui/system'

export type TagEditDialogProps = {}

export const TagEditDialog: FC<TagEditDialogProps> = props => {
  // let tags = useSelector(getPopulatedTags)
  return (
    <Stack spacing={2} maxWidth={360}>
      <TextField
        label="Название категории"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: 'red',
                }}
              />
            </InputAdornment>
          ),
        }}
      />
      <TagSelect
        label="Родительская категория"
        tagFilters={{ topLevel: true }}
        value={undefined}
        onChange={e => {}}
      />
      <FormGroup>
        <FormControlLabel
          control={<Checkbox defaultChecked />}
          label="Для доходов"
        />
        <FormControlLabel control={<Checkbox />} label="Для расходов" />
      </FormGroup>

      <Button size="large" variant="contained">
        Сохранить
      </Button>
    </Stack>
  )
}
