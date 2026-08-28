import { Button, ButtonBase } from '6-shared/ui/Button'
import type { FC } from 'react'
import { shallowEqual } from 'react-redux'
import { useFormik } from 'formik'
import { Checkbox, FormControlLabel, FormGroup } from '@mui/material'
import type { DialogProps } from '6-shared/ui/Dialog'
import { Dialog, DialogContent, DialogTitle } from '6-shared/ui/Dialog'
import { OutlinedField } from '6-shared/ui/OutlinedField'
import { ColorPicker, useColorPicker } from '6-shared/ui/ColorPickerPopover'
import { useAppDispatch } from 'store'
import { core } from 'zerro-core/redux'

// import { TagSelect } from '@components/TagSelect'
import { CurrencyCodeSelect } from './CurrencyCodeSelect'
import { VisibilitySelect } from './VisidilitySelect'
import { registerPopover } from '6-shared/historyPopovers'
import { useTranslation } from 'react-i18next'

const editDialog = registerPopover<
  { envelope?: core.envelopes.TPresentedEnvelope },
  DialogProps
>('envelopeEditDialog', {})

export const useEditDialog = () => {
  const { open } = editDialog.useMethods()
  return open
}

export const EnvelopeEditDialog: FC = () => {
  const { displayProps, extraProps, close, instanceKey } = editDialog.useProps()
  if (!extraProps.envelope) return null

  return (
    // A fresh form on every opening: the draft is Formik's, and it starts from
    // whichever envelope this opening carries. The key used to be handed to
    // the dialog through `displayProps`, which React 19 warns about.
    <EnvelopeEditDialogForm
      key={instanceKey}
      displayProps={displayProps}
      envelope={extraProps.envelope}
      close={close}
    />
  )
}

const EnvelopeEditDialogForm: FC<{
  displayProps: DialogProps
  envelope: core.envelopes.TPresentedEnvelope
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
      visibility: envelope.visibility || core.envelopes.envelopeVisibility.auto,
      keepIncome: envelope.keepIncome,
      colorHex: envelope.colorHex,
      currency: envelope.currency,
    },
    validate: values => {
      if (!values.originalName.trim()) {
        return { originalName: t('nameError') }
      }
    },
    onSubmit: values => {
      close()
      dispatch(
        core.envelopes.updateSettings({
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
        <form
          onSubmit={handleSubmit}
          className="mt-2 flex max-w-[360px] flex-col gap-4"
        >
          <OutlinedField
            label={t('nameLabel')}
            error={!!errors.originalName}
            helperText={errors.originalName}
            autoFocus
            name="originalName"
            value={values.originalName}
            onChange={handleChange}
            autoComplete="off"
            endAdornment={
              <Color
                value={values.colorHex}
                onChange={v => setFieldValue('colorHex', v)}
              />
            }
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
            label={t('currencyLabel')}
            value={values.currency}
            onChange={v => setFieldValue('currency', v)}
          />
          <VisibilitySelect
            label={t('visibilityLabel')}
            value={values.visibility}
            onChange={v => setFieldValue('visibility', v)}
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
        </form>
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
        style={{ backgroundColor: value ?? undefined }}
        className="size-6 rounded-[50%] [box-shadow:inset_0_0_0_1px_rgba(0,0,0,.1)]"
      />
      <ColorPicker />
    </>
  )
}
