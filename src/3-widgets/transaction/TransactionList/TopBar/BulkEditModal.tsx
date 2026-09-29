import { Button } from '@/6-shared/ui/Button'
import type { DialogProps } from '@/6-shared/ui/Dialog'
import type { Modify, TTransaction } from '@/6-shared/types'

import type { FC } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@/6-shared/ui/Dialog'
import { OutlinedField } from '@/6-shared/ui/OutlinedField'
import { useAppDispatch, useAppSelector } from '@/store'
import { track } from '@/6-shared/analytics'
import { core } from '@/zerro-core/redux'

import { CategoryRow } from '../../../category/CategoryRow'
import { applyCategoryAction, commonCategories } from '../../../category/model'

type BulkEditModalProps = Modify<DialogProps, { onClose: () => void }> & {
  ids: string[]
  onApply: () => void
}

export const BulkEditModal: FC<BulkEditModalProps> = ({
  ids,
  onClose,
  onApply,
  open = false,
  ...rest
}) => {
  const { t } = useTranslation('transactionsBulkEdit')
  const dispatch = useAppDispatch()
  const allTransactions = useAppSelector(core.transactions.selectAll)
  const transactions = ids.map(id => allTransactions[id]).filter(Boolean)
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

  const [tags, setTags] = useState(initialTags)
  const [originalTags, setOriginalTags] = useState(initialTags)
  const categories = commonCategories(Object.values(tags))
  const [comment, setComment] = useState(initialComment)

  const [prevState, setPrevState] = useState({ ids, open })
  if (prevState.ids !== ids || prevState.open !== open) {
    setPrevState({ ids, open })
    if (open) {
      setTags(initialTags)
      setOriginalTags(initialTags)
      setComment(initialComment)
    }
  }

  const onSave = () => {
    const tagsById = Object.fromEntries(
      Object.entries(tags).filter(
        ([id, value]) => !equalArrays(originalTags[id] ?? [], value)
      )
    )
    const opts = { tagsById, comment }
    if (Object.keys(tagsById).length || opts.comment) {
      track('transaction_tags_changed', {
        mode: 'bulk',
        source: 'bulk_modal',
      })
      dispatch(core.transactions.bulkEdit(ids, opts))
    }
    onApply()
  }

  return (
    <Dialog open={open} onClose={onClose} {...rest}>
      <DialogTitle>{t('editTransactions')}</DialogTitle>
      <DialogContent>
        {types.transfer === 0 && (
          <>
            <DialogContentText>{t('categories')}</DialogContentText>
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
              className="rounded-lg bg-background p-4"
            />
          </>
        )}

        <div className="pt-4">
          <OutlinedField
            value={comment}
            onChange={e => setComment(e.target.value)}
            label={t('comment')}
            multiline
            maxRows={4}
            fullWidth
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          {t('cancel')}
        </Button>
        <Button onClick={onSave} color="primary" variant="contained" autoFocus>
          {t('save')}
        </Button>
      </DialogActions>
    </Dialog>
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
