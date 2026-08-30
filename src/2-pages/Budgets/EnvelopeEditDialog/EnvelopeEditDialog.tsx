import { Button, ButtonBase } from '6-shared/ui/Button'
import type { FC, MouseEvent } from 'react'
import { shallowEqual } from 'react-redux'
import { useFormik } from 'formik'
import { CheckboxField } from '6-shared/ui/Checkbox'
import { Dialog, DialogContent, DialogTitle } from '6-shared/ui/Dialog'
import { OutlinedField } from '6-shared/ui/OutlinedField'
import { ColorPicker } from '6-shared/ui/ColorPickerPopover'
import { useAppDispatch, useAppSelector } from 'store'
import { core } from 'zerro-core/redux'

// import { TagSelect } from '@components/TagSelect'
import { CurrencyCodeSelect } from './CurrencyCodeSelect'
import { VisibilitySelect } from './VisibilitySelect'
import { defineScreen, useAsk } from '6-shared/overlays'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

/** A screen: the envelope it edits is an id, and the envelope itself is looked
 * up from it — so the dialog comes back from Back, Forward and a reload. */
const envelopeEditScreen =
  defineScreen<core.envelopes.TEnvelopeId>('envelopeEdit')

export const useEditDialog = () => envelopeEditScreen.useOpen()

export const EnvelopeEditDialog: FC = () => {
  const [id, setId] = envelopeEditScreen.use()
  const envelopes = useAppSelector(core.envelopes.selectAll)
  const close = useCallback(() => setId(null), [setId])
  const envelope = id ? envelopes[id] : undefined
  if (!envelope) return null

  return (
    // A fresh form per envelope: the draft is Formik's, and it starts from
    // whichever envelope the address names.
    <EnvelopeEditDialogForm
      key={envelope.id}
      envelope={envelope}
      onClose={close}
    />
  )
}

const EnvelopeEditDialogForm: FC<{
  envelope: core.envelopes.TPresentedEnvelope
  onClose: () => void
}> = ({ envelope, onClose }) => {
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
      onClose()
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
      open
      onClose={() => {
        // A dismissal with unsaved edits is ignored; Back closes it regardless,
        // which is the one closing path there is.
        if (shallowEqual(values, initialValues)) onClose()
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
          <div className="flex flex-col">
            <CheckboxField
              name="keepIncome"
              label={t('keepIncomeLabel')}
              checked={values.keepIncome}
              onCheckedChange={checked => setFieldValue('keepIncome', checked)}
            />
          </div>

          <Button type="submit" size="large" variant="contained">
            {t('btnSave')}
          </Button>
          <Button onClick={onClose} size="large">
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
  const ask = useAsk()
  const pick = async (e: MouseEvent<HTMLElement>) => {
    const color = await ask<string | null>(
      <ColorPicker value={value} anchorEl={e.currentTarget} />
    )
    // `null` is "no colour"; nothing at all means the question went unanswered.
    if (color !== undefined) onChange(color)
  }
  return (
    <ButtonBase
      onClick={pick}
      style={{ backgroundColor: value ?? undefined }}
      className="size-6 rounded-[50%] [box-shadow:inset_0_0_0_1px_rgba(0,0,0,.1)]"
    />
  )
}
