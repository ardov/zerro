import React, { FC, useEffect, useState } from 'react'
import Button from '@mui/material/Button'
import Dialog, { DialogProps } from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import { useAppDispatch } from '@store'
import { trModel } from '@entities/transaction'
import { getType } from '@entities/transaction/helpers'
import { TagList } from 'widgets/tag/TagList'
import { Modify, TTransaction } from '@shared/types'
import { Box, TextField } from '@mui/material'

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
  const dispatch = useAppDispatch()
  const allTransactions = trModel.useTransactions()
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
      dispatch(trModel.bulkEditTransactions(ids, opts))
    }
    onApply()
  }

  return (
    <Dialog open={open} onClose={onClose} {...rest}>
      <DialogTitle>Редактирование операций</DialogTitle>

      <DialogContent>
        {types.transfer === 0 && (
          <>
            <DialogContentText>Категории</DialogContentText>
            <TagList
              tags={tags}
              tagType={tagType}
              onChange={setTags}
              sx={{
                p: 2,
                bgcolor: 'background.default',
                borderRadius: 1,
              }}
            />
          </>
        )}

        <Box pt={2}>
          <TextField
            value={comment}
            onChange={e => setComment(e.target.value)}
            label="Комментарий"
            multiline
            maxRows="4"
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

function isSameTags(list: TTransaction[] = []) {
  return list
    .map(tr => JSON.stringify(tr.tag))
    .every((tags, i, arr) => tags === arr[0])
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
  let res = { income: 0, outcome: 0, transfer: 0 }
  list.forEach(tr => res[getType(tr) as 'income' | 'outcome' | 'transfer']++)
  return res
}
