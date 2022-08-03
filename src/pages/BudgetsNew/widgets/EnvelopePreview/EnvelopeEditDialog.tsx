import React, { FC, useState } from 'react'
import { shallowEqual } from 'react-redux'
import { v1 as uuidv1 } from 'uuid'
import { useFormik } from 'formik'
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
import { DataEntity, Modify } from 'shared/types'
import { ColorPicker } from 'shared/ui/ColorPickerPopover'
import { useAppDispatch, useAppSelector } from 'store'
import {
  envelopeVisibility,
  getEnvelopeId,
  IEnvelope,
  parseEnvelopeId,
  patchEnvelope,
} from 'models/envelope'
import { getUserCurrencyCode } from 'models/instrument'
import { TagSelect } from 'components/TagSelect'
import { CurrencyCodeSelect } from './CurrencyCodeSelect'
import { VisibilitySelect } from './VisidilitySelect'

// TODO: Доделать модалку для редактирования и создания категорий

export type TagEditDialogProps = Modify<
  DialogProps,
  {
    onClose: () => void
    envelope?: Partial<IEnvelope>
  }
>

export const EnvelopeEditDialog: FC<TagEditDialogProps> = props => {
  const { envelope, onClose, ...dialogProps } = props
  const dispatch = useAppDispatch()
  const isNew = !envelope?.id
  const id = envelope?.id || getEnvelopeId(DataEntity.Tag, uuidv1())
  const defaultCurrency = useAppSelector(getUserCurrencyCode)
  const {
    values,
    initialValues,
    handleSubmit,
    errors,
    handleChange,
    setFieldValue,
  } = useFormik({
    initialValues: {
      name: envelope?.name || '',
      parentTagId: envelope?.parent
        ? parseEnvelopeId(envelope.parent).id
        : null,
      visibility: envelope?.visibility || envelopeVisibility.auto,
      carryNegatives: envelope?.carryNegatives || false,
      keepIncome: envelope?.keepIncome || false,
      color: envelope?.color || null,
      group: envelope?.group || '',
      comment: envelope?.comment || '',
      currency: envelope?.currency || defaultCurrency,
    },
    validate: values => {
      if (!values.name.trim()) {
        return { name: 'Название категории точно пригодится 😉' }
      }
    },
    onSubmit: (values, helpers) => {
      const { parentTagId, ...envData } = values
      const parent = parentTagId
        ? getEnvelopeId(DataEntity.Tag, parentTagId)
        : null
      const patch = { id, parent, ...envData }
      dispatch(patchEnvelope(patch))
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
            label="Название конверта"
            error={!!errors.name}
            helperText={errors.name}
            autoFocus
            name="name"
            inputProps={{ autoComplete: 'off' }}
            value={values.name}
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
            value={values.parentTagId}
            onChange={v => setFieldValue('parentTagId', v || null)}
          />
          <TextField
            label="Группа"
            name="group"
            multiline
            inputProps={{ autoComplete: 'off' }}
            value={values.group}
            onChange={handleChange}
          />
          <TextField
            label="Комментарий"
            name="comment"
            multiline
            inputProps={{ autoComplete: 'off' }}
            value={values.comment}
            onChange={handleChange}
          />
          <CurrencyCodeSelect
            label="Валюта"
            name="currency"
            value={values.currency}
            onChange={handleChange}
          />
          <VisibilitySelect
            label="Показывать в бюджете"
            name="visibility"
            value={values.visibility}
            onChange={handleChange}
          />
          <FormGroup>
            {/* <FormControlLabel
              name="showIncome"
              checked={values.showIncome}
              onChange={handleChange}
              control={<Checkbox />}
              label="Доходная"
            /> */}
            <FormControlLabel
              name="keepIncome"
              checked={values.keepIncome}
              onChange={handleChange}
              control={<Checkbox />}
              label="Класть доходы в конверт"
            />
            <FormControlLabel
              name="carryNegatives"
              checked={values.carryNegatives}
              onChange={handleChange}
              control={<Checkbox />}
              label="Переносить минусы"
            />
            {/* <FormControlLabel
              name="showInBudget"
              checked={values.showInBudget}
              onChange={handleChange}
              control={<Checkbox />}
              label="Расходная"
            /> */}
            {/* <FormControlLabel
              name="budgetOutcome"
              checked={values.budgetOutcome}
              onChange={handleChange}
              control={<Checkbox />}
              label="Показывать в бюджете"
            /> */}
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
  value: string | null
  onChange: (v: string | null) => void
}

const Color: FC<ColorProps> = ({ value, onChange }) => {
  const [anchorEl, setAnchorEl] = useState<Element | null>(null)
  const hexColor = value
  const handleColorChange = (hex?: string | null) => {
    onChange(hex || null)
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
