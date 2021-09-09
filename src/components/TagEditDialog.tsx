import React, { FC } from 'react'
// import { useSelector } from 'react-redux'
// import { getPopulatedTags } from 'store/localData/tags'
import { Button, Stack, TextField } from '@mui/material'
import { TagSelect } from './TagSelect'

export type TagEditDialogProps = {}

export const TagEditDialog: FC<TagEditDialogProps> = props => {
  // let tags = useSelector(getPopulatedTags)
  return (
    <Stack>
      <TextField label="Название категории" />
      <TagSelect
        label="Родительская категория"
        tagFilters={{ topLevel: true }}
        value={undefined}
        onChange={e => {}}
      />

      <Button>Сохранить</Button>
    </Stack>
  )
}
