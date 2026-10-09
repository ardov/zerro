import { Button, IconButton } from '@/6-shared/ui/kit/Button'
import { FieldAddon } from '@/6-shared/ui/kit/Field'
import type { FC, MouseEvent } from 'react'
import { shallowEqual } from 'react-redux'
import { useFormik } from 'formik'
import { Select } from '@/6-shared/ui/kit/Select'
import { DialogSurface } from '@/6-shared/ui/kit/Dialog'
import { useBottomSheetLayout } from '@/6-shared/ui/kit/useBottomSheetLayout'
import { Input } from '@/6-shared/ui/kit/Input'
import { ColorPicker } from '@/3-widgets/ColorPicker'
import { useAppDispatch, useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'

import { CurrencyCodeSelect } from './CurrencyCodeSelect'
import { VisibilitySelect } from './VisibilitySelect'
import { defineScreen, useAsk } from '@/6-shared/overlays'
import { useCallback, useRef } from 'react'
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
  const narrow = useBottomSheetLayout()
  const formRef = useRef<HTMLFormElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
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
    <DialogSurface
      title={t('titleEdit')}
      mobile="drawer"
      closeButton={false}
      initialFocus={narrow ? formRef : nameRef}
      className="max-w-100"
      controller={{
        open: true,
        setOpen: open => {
          // Preserve dirty drafts on surface dismissal; Back still closes the screen.
          if (!open && shallowEqual(values, initialValues)) onClose()
        },
      }}
    >
      <form
        ref={formRef}
        tabIndex={-1}
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 outline-none"
      >
        <Input
          label={t('nameLabel')}
          placeholder={t('nameLabel')}
          error={errors.originalName}
          ref={nameRef}
          name="originalName"
          value={values.originalName}
          onChange={handleChange}
          autoComplete="off"
          end={
            <FieldAddon kind="action">
              <Color
                value={values.colorHex}
                onChange={v => setFieldValue('colorHex', v)}
              />
            </FieldAddon>
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
        <Select
          label={t('incomeLabel')}
          labelMode="floating"
          required
          value={values.keepIncome ? 'category' : 'outside'}
          onChange={value => setFieldValue('keepIncome', value === 'category')}
          items={[
            { value: 'category', label: t('keepIncomeLabel') },
            { value: 'outside', label: t('excludeIncomeLabel') },
          ]}
        />

        <Button type="submit" size="lg" variant="primary">
          {t('btnSave')}
        </Button>
        <Button onClick={onClose} size="lg" variant="secondary">
          {t('btnCancel')}
        </Button>
      </form>
    </DialogSurface>
  )
}

type ColorProps = {
  value: string | null
  onChange: (v: string | null) => void
}

const Color: FC<ColorProps> = ({ value, onChange }) => {
  const { t } = useTranslation('envelopeEditDialog')
  const ask = useAsk()
  const pick = async (e: MouseEvent<HTMLElement>) => {
    const color = await ask<string | null>(
      <ColorPicker value={value} anchorEl={e.currentTarget} />
    )
    // `null` is "no colour"; nothing at all means the question went unanswered.
    if (color !== undefined) onChange(color)
  }
  return (
    <IconButton onClick={pick} label={t('color')} variant="ghost" size="sm">
      <span
        aria-hidden
        className="size-7 rounded-full border border-ui-border"
        style={{ backgroundColor: value ?? undefined }}
      />
    </IconButton>
  )
}
