import React, { FC, useEffect, useState } from 'react'
import Button from '@material-ui/core/Button'
import Dialog, { DialogProps } from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogTitle from '@material-ui/core/DialogTitle'
import { useSelector, useDispatch } from 'react-redux'
import { getTransactions } from 'store/localData/transactions'
import { getType } from 'store/localData/transactions/helpers'
import { bulkEditTransactions } from 'store/localData/transactions/thunks'
import { TagList } from 'components/TagList'
import { Modify, Transaction } from 'types'
import { Box, TextField } from '@material-ui/core'

type BulkEditModalProps = Modify<DialogProps, { onClose: () => void }> & {
  ids: string[]
  onApply: () => void
}

export const BulkEditModal: FC<BulkEditModalProps> = ({
  ids,
  onClose,
  onApply,
  open = false,
  keepMounted = false,
  ...rest
}) => {
  const dispatch = useDispatch()
  const allTransactions = useSelector(getTransactions)
  const transactions = ids.map(id => allTransactions[id]).filter(Boolean)
  const sameTags = isSameTags(transactions)
  const sameComments = isSameComments(transactions)
  const types = getTypes(transactions)
  const tagType = types.income ? (types.outcome ? null : 'income') : 'outcome'
  const commonTags = sameTags ? transactions[0]?.tag || [] : ['mixed']

  const [tags, setTags] = useState(commonTags)
  const [comment, setComment] = useState(
    sameComments ? transactions[0]?.comment || '' : ''
  )

  useEffect(() => {
    if (open) setTags(commonTags)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setTags, ids, open])

  const onSave = () => {
    const opts = {
      tags: equalArrays(commonTags, tags) ? undefined : tags,
      comment,
    }
    if (opts.tags || opts.comment) {
      dispatch(bulkEditTransactions(ids, opts))
    }
    onApply()
  }

  return (
    <Dialog open={open} onClose={onClose} {...rest}>
      <DialogTitle>Редактирование операций</DialogTitle>

      <DialogContent>
        <DialogContentText>
          {types.transfer === 0
            ? 'Категории'
            : 'Пока здесь переводы не поддерживаются'}
        </DialogContentText>

        {types.transfer === 0 && (
          <TagList
            tags={tags}
            tagType={tagType}
            onChange={setTags}
            p={2}
            bgcolor="background.default"
            borderRadius="borderRadius"
          />
        )}

        <Box p={2}>
          <TextField
            value={comment}
            onChange={e => setComment(e.target.value)}
            label="Комментарий"
            multiline
            rowsMax="4"
            fullWidth
            helperText=""
            variant="outlined"
            margin="dense"
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="primary">
          Отмена
        </Button>
        <Button onClick={onSave} color="primary" variant="contained" autoFocus>
          Применить изменения
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function isSameTags(list: Transaction[] = []) {
  return list
    .map(tr => JSON.stringify(tr.tag))
    .every((tags, i, arr) => tags === arr[0])
}
function isSameComments(list: Transaction[] = []) {
  return list
    .map(tr => tr.comment)
    .every((comment, i, arr) => comment === arr[0])
}

function equalArrays(a: string[], b: string[]) {
  return JSON.stringify(a) === JSON.stringify(b)
}

function getTypes(list: Transaction[] = []) {
  let res = { income: 0, outcome: 0, transfer: 0 }
  list.forEach(tr => res[getType(tr) as 'income' | 'outcome' | 'transfer']++)
  return res
}
