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
import { Box, IconButton } from '@material-ui/core'
import TagSelect2 from 'components/TagSelect2'
import TagChip from 'components/TagChip'
import { Tooltip } from 'components/Tooltip'
import AddIcon from '@material-ui/icons/Add'
import { setTagsToTransactions } from 'store/localData/transactions/thunks'

function isSameTags(list = []) {
  return list
    .map(tr => JSON.stringify(tr.tag))
    .every((tags, i, arr) => tags === arr[0])
}

function isSameMain(list = []) {
  return list.map(tr => tr.tag?.[0]).every((tags, i, arr) => tags === arr[0])
}
function isSameAdditional(list = []) {
  return list
    .map(tr => {
      const [main, ...additional] = tr.tag
      return JSON.stringify(additional)
    })
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

export default function BulkEditModal({ ids, onClose, open = false, ...rest }) {
  const dispatch = useDispatch()
  const allTransactions = useSelector(getTransactions)
  const transactions = ids.map(id => allTransactions[id]).filter(Boolean)
  const sameTags = isSameTags(transactions)
  const types = getTypes(transactions)
  const commonTags = sameTags ? transactions[0]?.tag || [] : ['mixed']

  const [tags, setTags] = useState(commonTags)

  useEffect(() => {
    setTags(commonTags)
  }, [setTags, ids])

  const removeTag = removeId =>
    tags && setTags(tags.filter(id => id !== removeId))
  const replaceTag = (oldId, newId) =>
    tags && setTags(tags.map(id => (id === oldId ? newId : id)))
  const addTag = id => setTags(tags ? [...tags, id] : [id])

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
          <Box p={2} bgcolor="background.default" borderRadius="borderRadius">
            {tags.map(id => (
              <TagSelect2
                key={id}
                onChange={newId => replaceTag(id, newId)}
                exclude={tags}
                // tagType={type}
                trigger={
                  <Box mr={1} my={0.5} display="inline-block">
                    <TagChip id={id} onDelete={() => removeTag(id)} />
                  </Box>
                }
              />
            ))}
            <TagSelect2
              onChange={id => addTag(id)}
              exclude={tags}
              // tagType={type}
              trigger={
                <Box my={0.5} display="inline-block">
                  <Tooltip title="Добавить категорию">
                    <IconButton
                      edge="end"
                      size="small"
                      children={<AddIcon fontSize="inherit" />}
                    />
                  </Tooltip>
                </Box>
              }
            />
          </Box>
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
