import { FieldAddon } from '@/6-shared/ui/kit/Field'
import type { FC } from 'react'
import { Select } from '@/6-shared/ui/kit/Select'
import { DialogSurface } from '@/6-shared/ui/kit/Dialog'
import { useBottomSheetLayout } from '@/6-shared/ui/kit/useBottomSheetLayout'
import { Input } from '@/6-shared/ui/kit/Input'
import { AppearancePicker } from '@/3-widgets/AppearancePicker'
import { useAppDispatch, useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'

import { CurrencyCodeSelect } from './CurrencyCodeSelect'
import { VisibilitySelect } from './VisibilitySelect'
import { defineScreen } from '@/6-shared/overlays'
import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

/** A screen: the envelope it edits is an id, and the envelope itself is looked
 * up from it — so the dialog comes back from Back, Forward and a reload. */
const envelopeEditScreen =
  defineScreen<core.envelopes.TEnvelopeId>('envelopeEdit')

export const useEditDialog = () => envelopeEditScreen.useOpen()

export const EnvelopeEditDialog: FC = () => {
  const dispatch = useAppDispatch()
  const envelopes = useAppSelector(core.envelopes.selectAll)
  const [retainedId, setRetainedId] = useState<core.envelopes.TEnvelopeId>()
  // The name draft lives with the screen owner so Back can still save it.
  const [nameDraft, setNameDraft] = useState<string | null>(null)
  const [invalidName, setInvalidName] = useState(false)
  const saveName = () => {
    const envelope = retainedId ? envelopes[retainedId] : undefined
    if (nameDraft === null || !envelope) return
    const name = nameDraft.trim()
    if (!name) {
      setInvalidName(true)
      return
    }
    if (name !== envelope.originalName)
      dispatch(core.envelopes.rename(envelope.id, name))
    setNameDraft(null)
  }
  const [id, setId] = envelopeEditScreen.use(saveName)
  // Keep the draft until the surface finishes its closing transition.
  if (id !== undefined && id !== retainedId) {
    setRetainedId(id)
    setNameDraft(null)
    setInvalidName(false)
  }
  const close = useCallback(() => setId(null), [setId])
  const renderedId = id ?? retainedId
  const envelope = renderedId ? envelopes[renderedId] : undefined
  if (!envelope) return null

  return (
    <EnvelopeEditDialogForm
      key={envelope.id}
      envelope={envelope}
      open={id !== undefined}
      nameDraft={nameDraft}
      invalidName={invalidName}
      onNameChange={value => {
        setNameDraft(value)
        setInvalidName(false)
      }}
      onNameCommit={saveName}
      onClose={close}
      onOpenChangeComplete={open => {
        if (!open) setRetainedId(undefined)
      }}
    />
  )
}

const EnvelopeEditDialogForm: FC<{
  envelope: core.envelopes.TPresentedEnvelope
  open: boolean
  nameDraft: string | null
  invalidName: boolean
  onNameChange: (value: string) => void
  onNameCommit: () => void
  onClose: () => void
  onOpenChangeComplete: (open: boolean) => void
}> = props => {
  const {
    envelope,
    open,
    nameDraft,
    invalidName,
    onNameChange,
    onNameCommit,
    onClose,
    onOpenChangeComplete,
  } = props
  const narrow = useBottomSheetLayout()
  const formRef = useRef<HTMLFormElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const dispatch = useAppDispatch()
  const { t } = useTranslation('envelopeEditDialog')
  const id = envelope.id
  const canRename =
    envelope.type !== core.envelopes.EnvType.Payee &&
    id !== core.envelopes.envId.get(core.envelopes.EnvType.Tag, null)

  return (
    <DialogSurface
      title={t('titleEdit')}
      mobile="drawer"
      initialFocus={narrow ? formRef : nameRef}
      className="max-w-100"
      onOpenChangeComplete={onOpenChangeComplete}
      controller={{
        open,
        setOpen: open => {
          if (!open) onClose()
        },
      }}
    >
      <form
        ref={formRef}
        inert={!open}
        tabIndex={-1}
        onSubmit={event => {
          event.preventDefault()
          nameRef.current?.blur()
        }}
        className="flex flex-col gap-4 outline-none"
      >
        <Input
          label={t('nameLabel')}
          placeholder={t('nameLabel')}
          error={invalidName ? t('nameError') : undefined}
          readOnly={!canRename}
          ref={nameRef}
          name="originalName"
          value={nameDraft ?? envelope.originalName}
          onValueChange={onNameChange}
          onBlur={onNameCommit}
          autoComplete="off"
          start={
            <FieldAddon kind="action" className="w-12">
              <AppearancePicker envelope={envelope} />
            </FieldAddon>
          }
        />

        <CurrencyCodeSelect
          label={t('currencyLabel')}
          value={envelope.currency}
          onChange={currency =>
            dispatch(
              core.envelopes.patchMeta({ envelopeId: id, set: { currency } })
            )
          }
        />
        <VisibilitySelect
          label={t('visibilityLabel')}
          value={envelope.visibility}
          onChange={visibility =>
            dispatch(
              core.envelopes.patchMeta({ envelopeId: id, set: { visibility } })
            )
          }
        />
        <Select
          label={t('incomeLabel')}
          labelMode="floating"
          required
          value={envelope.keepIncome ? 'category' : 'outside'}
          onChange={value =>
            dispatch(
              core.envelopes.patchMeta({
                envelopeId: id,
                set: { keepIncome: value === 'category' },
              })
            )
          }
          items={[
            { value: 'category', label: t('keepIncomeLabel') },
            { value: 'outside', label: t('excludeIncomeLabel') },
          ]}
        />
      </form>
    </DialogSurface>
  )
}
