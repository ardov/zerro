import React, { FC } from 'react'
import { shallowEqual } from 'react-redux'
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
import { envelopeVisibility, TEnvelope } from '5-entities/envelope'
import { updateEnvelopeSettings } from 'core-next/adapters/redux'
// import { TagSelect } from '@components/TagSelect'
import { CurrencyCodeSelect } from './CurrencyCodeSelect'
import { VisibilitySelect } from './VisidilitySelect'
import { registerPopover } from '6-shared/historyPopovers'
import { useTranslation } from 'react-i18next'

const editDialog = registerPopover<{ envelope?: TEnvelope }, DialogProps>(
  'envelopeEditDialog',
  {}
)

export const useEditDialog = () => {
  const { open } = editDialog.useMethods()
  return open
}

export const EnvelopeEditDialog: FC = () => {
  const { displayProps, extraProps, close } = editDialog.useProps()
  if (!extraProps.envelope) return null

  return (
    <EnvelopeEditDialogForm
      displayProps={displayProps}
      envelope={extraProps.envelope}
      close={close}
    />
  )
}

const EnvelopeEditDialogForm: FC<{
  displayProps: DialogProps
  envelope: TEnvelope
  close: () => void
}> = ({ displayProps, envelope, close }) => {
  const dispatch = useAppDispatch()
  const { t } = useTranslation('envelopeEditDialog')
  const id = envelope.id
  const {
    values,
    initialValues,
    handleSubmit,
    errors,
    handleChange,
    setFieldValue,
  } = useFormik({
    initialValues: {
      originalName: envelope.originalName,
      visibility: envelope.visibility || envelopeVisibility.auto,
      keepIncome: envelope.keepIncome,
      colorHex: envelope.colorHex,
      currency: envelope.currency,
    },
    validate: values => {
      if (!values.originalName.trim()) {
        return { originalName: t('nameError') }
      }
    },
    onSubmit: (values, helpers) => {
      close()
      dispatch(
        updateEnvelopeSettings({
          id,
          name: values.originalName,
          colorHex: values.colorHex,
          currency: values.currency,
          visibility: values.visibility,
          keepIncome: values.keepIncome,
        })
      )
    },
    enableReinitialize: true,
  })

  return (
    <Dialog
      {...displayProps}
      onClose={() => {
        // TODO: with back button it closes anyway, maybe we can prevent it somehow
        if (shallowEqual(values, initialValues)) close()
      }}
    >
      <DialogTitle>{t('titleEdit')}</DialogTitle>
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
            {t('btnSave')}
          </Button>
          <Button onClick={close} size="large">
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
