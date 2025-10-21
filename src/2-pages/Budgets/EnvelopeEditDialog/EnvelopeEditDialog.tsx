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
import { ColorPicker, useColorPicker } from '6-shared/ui/ColorPickerPopover'
import { useAppDispatch } from 'store'
import {
  envelopeModel,
  envelopeVisibility,
  EnvType,
  TEnvelope,
} from '5-entities/envelope'
// import { TagSelect } from '@components/TagSelect'
import { CurrencyCodeSelect } from './CurrencyCodeSelect'
import { VisibilitySelect } from './VisidilitySelect'
import { userModel } from '5-entities/user'
import { registerPopover } from '6-shared/historyPopovers'
import { useTranslation } from 'react-i18next'

const editDialog = registerPopover<
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
  const { t } = useTranslation('envelopeEditDialog')
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
      colorHex: envelope?.colorHex || null,
      group: envelope?.group || '',
      comment: envelope?.comment || '',
      currency: envelope?.currency || defaultCurrency,
    },
    validate: values => {
      if (!values.originalName.trim()) {
        return { originalName: t('nameError') }
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
      <DialogTitle>{t(isNew ? 'titleNew' : 'titleEdit')}</DialogTitle>
      <DialogContent>
        <Stack
          component="form"
          onSubmit={handleSubmit}
          spacing={2}
          sx={{
            maxWidth: 360,
            mt: 1,
          }}
        >
          <TextField
            label={t('nameLabel')}
            error={!!errors.originalName}
            helperText={errors.originalName}
            autoFocus
            name="originalName"
            value={values.originalName}
            onChange={handleChange}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <Color
                      value={values.colorHex}
                      onChange={v => setFieldValue('colorHex', v)}
                    />
                  </InputAdornment>
                ),
              },

              htmlInput: { autoComplete: 'off' },
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
            name="currency"
            label={t('currencyLabel')}
            value={values.currency}
            onChange={handleChange}
          />
          <VisibilitySelect
            name="visibility"
            label={t('visibilityLabel')}
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
              label={t('keepIncomeLabel')}
              checked={values.keepIncome}
              onChange={handleChange}
              control={<Checkbox />}
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
            {t(id ? 'btnSave' : 'btnCreate')}
          </Button>
          <Button onClick={displayProps.onClose} size="large">
            {t('btnCancel')}
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
