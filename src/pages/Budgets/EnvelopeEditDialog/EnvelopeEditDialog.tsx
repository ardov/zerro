import React, { FC } from 'react'
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
import { ColorPicker, useColorPicker } from '@shared/ui/ColorPickerPopover'
import { useAppDispatch } from '@store'
import {
  envelopeModel,
  envelopeVisibility,
  EnvType,
  TEnvelope,
} from '@entities/envelope'
// import { TagSelect } from '@components/TagSelect'
import { CurrencyCodeSelect } from './CurrencyCodeSelect'
import { VisibilitySelect } from './VisidilitySelect'
import { userModel } from '@entities/user'
import { makePopoverHooks } from '@shared/ui/PopoverManager'

const editDialog = makePopoverHooks<
  { envelope?: Partial<TEnvelope> },
  DialogProps
>('envelopeEditDialog', {})

export const useEditDialog = () => {
  const { open } = editDialog.useMethods()
  return open
}

export const EnvelopeEditDialog: FC = () => {
  const { displayProps, extraProps } = editDialog.useProps()
  const { envelope } = extraProps
  const dispatch = useAppDispatch()
  const isNew = !envelope?.id
  const id = envelope?.id || envelopeModel.makeId(EnvType.Tag, uuidv1())
  const defaultCurrency = userModel.useUserCurrency()
  const {
    values,
    initialValues,
    handleSubmit,
    errors,
    handleChange,
    setFieldValue,
  } = useFormik({
    initialValues: {
      originalName: envelope?.originalName || '',
      parentTagId: envelope?.parent
        ? envelopeModel.parseId(envelope.parent).id
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
      if (!values.originalName.trim()) {
        return { originalName: 'Название точно пригодится 😉' }
      }
    },
    onSubmit: (values, helpers) => {
      displayProps.onClose()
      const { parentTagId, ...envData } = values
      const parent = parentTagId
        ? envelopeModel.makeId(EnvType.Tag, parentTagId)
        : null
      const patch = { id, parent, ...envData }
      dispatch(envelopeModel.patchEnvelope(patch))
    },
    enableReinitialize: true,
  })

  return (
    <Dialog
      {...displayProps}
      onClose={() => {
        // TODO: with back button it closes anyway, maybe we can prevent it somehow
        if (shallowEqual(values, initialValues)) displayProps.onClose()
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
            label="Название"
            error={!!errors.originalName}
            helperText={errors.originalName}
            autoFocus
            name="originalName"
            inputProps={{ autoComplete: 'off' }}
            value={values.originalName}
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

          {/* Can use dnd */}
          {/* <TagSelect
            label="Родительская категория"
            tagFilters={{ topLevel: true, exclude: id ? [id] : undefined }}
            value={values.parentTagId}
            onChange={v => setFieldValue('parentTagId', v || null)}
          /> */}

          {/* Can use dnd */}
          {/* <TextField
            label="Группа"
            name="group"
            inputProps={{ autoComplete: 'off' }}
            value={values.group}
            onChange={handleChange}
          /> */}

          {/* <TextField
            label="Комментарий"
            name="comment"
            multiline
            inputProps={{ autoComplete: 'off' }}
            value={values.comment}
            onChange={handleChange}
          /> */}
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
              label="Класть доходы в категорию"
            />
            {/* <FormControlLabel
              name="carryNegatives"
              checked={values.carryNegatives}
              onChange={handleChange}
              control={<Checkbox />}
              label="Переносить минусы"
            /> */}
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
          <Button onClick={displayProps.onClose} size="large">
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
  const open = useColorPicker(value, onChange)
  return (
    <>
      <ButtonBase
        onClick={open}
        sx={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          backgroundColor: value,
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.1)',
        }}
      />
      <ColorPicker />
    </>
  )
}
