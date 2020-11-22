import React, { useEffect, useState } from 'react'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogTitle from '@material-ui/core/DialogTitle'
import { useSelector, useDispatch } from 'react-redux'
import { getTransactions } from 'store/localData/transactions'
import { getType } from 'store/localData/transactions/helpers'
import { setTagsToTransactions } from 'store/localData/transactions/thunks'
import { TagList } from 'components/TagList'

function isSameTags(list = []) {
  return list
    .map(tr => JSON.stringify(tr.tag))
    .every((tags, i, arr) => tags === arr[0])
}

function equalArrays(a, b) {
  return JSON.stringify(a) === JSON.stringify(b)
}

function getTypes(list = []) {
  let res = { income: 0, outcome: 0, transfer: 0 }
  list.forEach(tr => res[getType(tr)]++)
  return res
}

export default function BulkEditModal({
  ids,
  onClose,
  open = false,
  keepMounted = false,
  ...rest
}) {
  const dispatch = useDispatch()
  const allTransactions = useSelector(getTransactions)
  const transactions = ids.map(id => allTransactions[id]).filter(Boolean)
  const sameTags = isSameTags(transactions)
  const types = getTypes(transactions)
  const tagType = types.income ? (types.outcome ? false : 'income') : 'outcome'
  const commonTags = sameTags ? transactions[0]?.tag || [] : ['mixed']

  const [tags, setTags] = useState(commonTags)

  useEffect(() => {
    if (open) setTags(commonTags)
  }, [setTags, ids, open])

  const onSave = () => {
    if (!equalArrays(commonTags, tags))
      dispatch(setTagsToTransactions(ids, tags))
    onClose()
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
