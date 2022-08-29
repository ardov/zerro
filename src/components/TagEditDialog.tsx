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
import { Modify } from '@shared/types'
import { shallowEqual } from 'react-redux'
import { createTag } from '@models/tag/thunks'
import { useFormik } from 'formik'
import { hex2int, int2hex } from '@shared/helpers/color'
import { ColorPicker } from '../shared/ui/ColorPickerPopover'
import { v1 as uuidv1 } from 'uuid'
import {
  getTagMeta,
  setTagComment,
  setTagCurrency,
} from '@models/hiddenData/tagMeta'
import { getUserInstrumentId } from '@models/user'
import { CurrencySelect } from './CurrencySelect'
import { useAppDispatch, useAppSelector } from '@store'
import { ITag } from '@shared/types'

// TODO: Доделать модалку для редактирования и создания категорий

export type TagEditDialogProps = Modify<
  DialogProps,
  {
    onClose: () => void
    tag?: Partial<ITag>
  }
>

export const TagEditDialog: FC<TagEditDialogProps> = props => {
  const { tag, onClose, ...dialogProps } = props
  const dispatch = useAppDispatch()
  const isNew = !tag?.id
  const id = tag?.id || uuidv1()
  const meta = useAppSelector(getTagMeta)[id]
  const userInstrument = useAppSelector(getUserInstrumentId)
  const {
    values,
    initialValues,
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
      budgetOutcome: tag?.budgetOutcome || false,
      color: tag?.color || null,
      comment: meta?.comment || '',
      currency: meta?.currency || userInstrument,
    },
    validate: values => {
      if (!values.title.trim()) {
        return { title: 'Название категории точно пригодится 😉' }
      }
    },
    onSubmit: (values, helpers) => {
      const { comment, currency, ...tagData } = values
      const newTag = dispatch(createTag({ ...tagData, id }))
      console.log('newTag', newTag)
      dispatch(setTagComment(id, comment))
      dispatch(setTagCurrency(id, currency))
      onClose()
    },
    enableReinitialize: true,
  })

  return (
    <Dialog
      {...dialogProps}
      onClose={() => {
        if (shallowEqual(values, initialValues)) onClose()
      }}
    >
      <DialogTitle>
        {isNew ? 'Новая категория' : 'Редактирование категории'}
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
          <TextField
            label="Комментарий"
            name="comment"
            multiline
            inputProps={{ autoComplete: 'off' }}
            value={values.comment}
            onChange={handleChange}
          />
          <CurrencySelect
            label="Валюта"
            name="currency"
            value={values.currency}
            onChange={handleChange}
          />
          <FormGroup>
            <FormControlLabel
              name="showIncome"
              checked={values.showIncome}
              onChange={handleChange}
              control={<Checkbox />}
              label="Доходная"
            />
            <FormControlLabel
              name="showOutcome"
              checked={values.showOutcome}
              onChange={handleChange}
              control={<Checkbox />}
              label="Расходная"
            />
            <FormControlLabel
              name="budgetOutcome"
              checked={values.budgetOutcome}
              onChange={handleChange}
              control={<Checkbox />}
              label="Показывать в бюджете"
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
  const hexColor = int2hex(value)
  const handleColorChange = (hex?: string | null) => {
    onChange(hex2int(hex))
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
