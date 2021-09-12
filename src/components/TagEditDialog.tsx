import React, { FC, useState } from 'react'
import {
  Button,
  ButtonBase,
  Checkbox,
  Dialog,
  DialogContent,
  DialogProps,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  InputAdornment,
  Stack,
  TextField,
} from '@mui/material'
import { TagSelect } from './TagSelect'
import { Modify, Tag } from 'types'
import { useDispatch } from 'react-redux'
import { createTag } from 'store/localData/tags/thunks'
import { useFormik } from 'formik'
import { hexToInt, intToHex } from 'helpers/convertColor'
import { ColorPicker } from './ColorPickerPopover'

// TODO: Доделать модалку для редактирования и создания категорий

export type TagEditDialogProps = Modify<
  DialogProps,
  {
    onClose: () => void
    tag?: Partial<Tag>
  }
>

export const TagEditDialog: FC<TagEditDialogProps> = props => {
  const { tag, onClose, ...dialogProps } = props
  const dispatch = useDispatch()
  const id = tag?.id
  const {
    values,
    handleSubmit,
    errors,
    handleChange,
    setFieldValue,
  } = useFormik({
    initialValues: {
      title: tag?.title || '',
      parent: tag?.parent || null,
      showIncome: tag?.showIncome || false,
      showOutcome: tag?.showOutcome || false,
      color: tag?.color || null,
    },
    validate: values => {
      if (!values.title) {
        return { title: 'Название категории точно пригодится 😉' }
      }
    },
    onSubmit: values => {
      const newTag = dispatch(createTag(values))
      onClose()
      console.log(newTag)
    },
  })

  return (
    <Dialog {...dialogProps}>
      <DialogTitle>
        {id ? 'Редактирование категории' : 'Новая категория'}
      </DialogTitle>
      <DialogContent>
        <Stack
          component="form"
          onSubmit={handleSubmit}
          spacing={2}
          maxWidth={360}
          mt={1}
        >
          <TextField
            label="Название категории"
            error={!!errors.title}
            helperText={errors.title}
            autoFocus
            name="title"
            inputProps={{ autoComplete: 'off' }}
            value={values.title}
            onChange={handleChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Color
                    value={values.color}
                    onChange={v => setFieldValue('color', v)}
                  />
                </InputAdornment>
              ),
            }}
          />
          <TagSelect
            label="Родительская категория"
            tagFilters={{ topLevel: true, exclude: id ? [id] : undefined }}
            value={values.parent}
            onChange={v => setFieldValue('parent', v)}
          />
          <FormGroup>
            <FormControlLabel
              name="showIncome"
              value={values.showIncome}
              onChange={handleChange}
              control={<Checkbox />}
              label="Доходная"
            />
            <FormControlLabel
              name="showOutcome"
              value={values.showOutcome}
              onChange={handleChange}
              control={<Checkbox />}
              label="Расходная"
            />
          </FormGroup>

          <Button type="submit" size="large" variant="contained">
            {id ? 'Сохранить категорию' : 'Создать категорию'}
          </Button>
          <Button onClick={onClose} size="large">
            Отменить
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  )
}

type ColorProps = {
  value: number | null
  onChange: (v: number | null) => void
}

const Color: FC<ColorProps> = ({ value, onChange }) => {
  const [anchorEl, setAnchorEl] = useState<Element | null>(null)
  const hexColor = intToHex(value)
  const handleColorChange = (hex?: string | null) => {
    onChange(hexToInt(hex))
  }
  return (
    <>
      <ButtonBase
        onClick={e => setAnchorEl(e.currentTarget)}
        sx={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          backgroundColor: hexColor,
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.1)',
        }}
      />

      <ColorPicker
        open={!!anchorEl}
        anchorEl={anchorEl}
        value={hexColor}
        onClose={() => setAnchorEl(null)}
        onChange={handleColorChange}
      />
    </>
  )
}
