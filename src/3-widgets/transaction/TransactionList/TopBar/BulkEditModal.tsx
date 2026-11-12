import { Button } from '@/6-shared/ui/kit/Button'
import type { SurfaceController } from '@/6-shared/overlays'
import { DialogSurface } from '@/6-shared/ui/kit/Dialog'
import type { TTransaction } from '@/6-shared/types'

import type { FC } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FieldAddon, FieldSurface } from '@/6-shared/ui/kit/Field'
import { NotesIcon, CategoryIcon } from '@/6-shared/ui/Icons'
import { Textarea } from '@/6-shared/ui/kit/Textarea'
import { useAppDispatch, useAppSelector } from '@/store'
import { track } from '@/6-shared/analytics'
import { core } from '@/zerro-core/redux'

import { MerchantField } from '../../TransactionPreview/MerchantField'
import type { TNamedMerchant } from '../../TransactionPreview/draft'

import { CategoryRow } from '../../../category/CategoryRow'
import { applyCategoryAction, commonCategories } from '../../../category/model'

type BulkEditModalProps = {
  controller: SurfaceController
  ids: string[]
  onApply: () => void
}

export const BulkEditModal: FC<BulkEditModalProps> = ({
  ids,
  controller,
  onApply,
}) => {
  const { open, setOpen } = controller
  const onClose = () => setOpen(false)
  const { t } = useTranslation('transactionsBulkEdit')
  const { t: transactionText } = useTranslation('transaction')
  const dispatch = useAppDispatch()
  const allTransactions = useAppSelector(core.transactions.selectAll)
  const transactions = ids.map(id => allTransactions[id]).filter(Boolean)
  const getType = core.transactions.useType()
  const hasTransfer = transactions.some(tr => getType(tr) === 'transfer')
  const hasDebt = transactions.some(tr => {
    const type = getType(tr)
    return type === 'incomeDebt' || type === 'outcomeDebt'
  })
  const sameComments = isSameComments(transactions)
  const types = getTypes(transactions)
  const preferredType = types.income
    ? types.outcome
      ? undefined
      : 'income'
    : 'outcome'
  const initialTags = Object.fromEntries(
    transactions.map(tr => [tr.id, tr.tag ?? []])
  )
  const initialComment = sameComments ? transactions[0]?.comment || '' : ''

  const first = transactions[0]
  const sameMerchant = transactions.every(
    tr =>
      (tr.merchant ?? null) === (first?.merchant ?? null) &&
      (tr.merchant || (tr.payee || '') === (first?.payee || ''))
  )
  const [merchant, setMerchant] = useState<TNamedMerchant | null | undefined>(
    undefined
  )
  const shownMerchant =
    merchant === undefined
      ? sameMerchant && first?.merchant
        ? { id: first.merchant }
        : null
      : merchant
  const shownPayee =
    merchant === undefined
      ? sameMerchant
        ? (first?.payee ?? null)
        : null
      : (merchant?.title ?? null)

  const [tags, setTags] = useState(initialTags)
  const [originalTags, setOriginalTags] = useState(initialTags)
  const categories = commonCategories(Object.values(tags))
  const [comment, setComment] = useState(initialComment)
  const [commentChanged, setCommentChanged] = useState(false)

  const [prevState, setPrevState] = useState({ ids, open })
  if (prevState.ids !== ids || prevState.open !== open) {
    setPrevState({ ids, open })
    if (open) {
      setMerchant(undefined)
      setTags(initialTags)
      setOriginalTags(initialTags)
      setComment(initialComment)
      setCommentChanged(false)
    }
  }

  const onSave = () => {
    const tagsById = Object.fromEntries(
      Object.entries(tags).filter(
        ([id, value]) => !equalArrays(originalTags[id] ?? [], value)
      )
    )
    const opts = {
      merchant,
      tagsById,
      comment: commentChanged ? comment : undefined,
    }
    if (
      Object.keys(tagsById).length ||
      commentChanged ||
      merchant !== undefined
    ) {
      if (Object.keys(tagsById).length)
        track('transaction_tags_changed', {
          mode: 'bulk',
          source: 'bulk_modal',
        })
      dispatch(core.transactions.bulkEdit(ids, opts))
    }
    onApply()
  }

  return (
    <DialogSurface
      controller={controller}
      title={t('editTransactions')}
      mobile="drawer"
      disablePointerDismissal
    >
      <div className="flex flex-col gap-3">
        {types.transfer === 0 && (
          <FieldSurface
            role="group"
            aria-label={t('categories')}
            addonAlign="first-line"
            start={
              <FieldAddon kind="icon">
                <CategoryIcon />
              </FieldAddon>
            }
          >
            <CategoryRow
              {...categories}
              preferredType={preferredType}
              onAction={action =>
                setTags(current =>
                  Object.fromEntries(
                    Object.entries(current).map(([id, value]) => [
                      id,
                      applyCategoryAction(value, action),
                    ])
                  )
                )
              }
              className="min-w-0 flex-1 py-2"
            />
          </FieldSurface>
        )}

        {!hasTransfer && (
          <MerchantField
            required={hasDebt}
            mixedLabel={
              !sameMerchant && merchant === undefined
                ? t('mixedMerchants')
                : undefined
            }
            merchant={shownMerchant}
            payee={shownPayee}
            originalPayee={null}
            debt={false}
            onChange={setMerchant}
            placeholder={transactionText('payee')}
          />
        )}

        <Textarea
          label={t('comment')}
          placeholder={t('comment')}
          start={
            <FieldAddon kind="icon">
              <NotesIcon />
            </FieldAddon>
          }
          value={comment}
          onChange={event => {
            setComment(event.target.value)
            setCommentChanged(true)
          }}
          maxRows={6}
        />
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button onClick={onClose} variant="secondary">
          {t('cancel')}
        </Button>
        <Button onClick={onSave} variant="primary" autoFocus>
          {t('save')}
        </Button>
      </div>
    </DialogSurface>
  )
}

function isSameComments(list: TTransaction[] = []) {
  return list
    .map(tr => tr.comment)
    .every((comment, i, arr) => comment === arr[0])
}

function equalArrays(a: string[], b: string[]) {
  return JSON.stringify(a) === JSON.stringify(b)
}

function getTypes(list: TTransaction[] = []) {
  const res = { income: 0, outcome: 0, transfer: 0 }
  list.forEach(
    tr =>
      res[core.transactions.getType(tr) as 'income' | 'outcome' | 'transfer']++
  )
  return res
}
