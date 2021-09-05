import React, { FC } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  Button,
} from '@mui/material'
import { makeStyles } from '@mui/styles'
import AddIcon from '@mui/icons-material/Add'
import {
  getTagAccMap,
  addConnection,
} from 'store/localData/hiddenData/accTagMap'
import { getAccounts, getSavingAccounts } from 'store/localData/accounts'
import CloseIcon from '@mui/icons-material/Close'
import { Tooltip } from 'components/Tooltip'
import { useEffect } from 'react'

const useStyles = makeStyles(({ shape, spacing, palette, breakpoints }) => ({
  chipContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    margin: spacing(-0.5),
    '& > .addButton': { opacity: 0, transition: '.1s' },
    '&:hover > .addButton': { opacity: 1 },
  },
  addButton: { margin: spacing(0.5) },
  chip: { margin: spacing(0.5) },
  bg: {
    borderRadius: shape.borderRadius,
    background: palette.background.default,
    padding: spacing(2),
  },
}))

type LinkedAccsProps = {
  id: string
}

export const LinkedAccs: FC<LinkedAccsProps> = ({ id }) => {
  const c = useStyles()
  const [anchorEl, setAnchorEl] = React.useState<Element | null>(null)
  const [hideArchived, setHideArchived] = React.useState(true)
  const linkedAccs = useSelector(state => getTagAccMap(state)[id])
  const accounts = useSelector(getAccounts)
  const savingAccs = useSelector(getSavingAccounts)
  const dispatch = useDispatch()
  const removeConnection = (id: string) => dispatch(addConnection(id, null))

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = event =>
    setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)

  // Hide archived on every open
  useEffect(() => {
    if (anchorEl) setHideArchived(true)
  }, [anchorEl])

  const accsToAdd = savingAccs.filter(acc => {
    // Hide already linked accounts
    if (linkedAccs?.includes(acc.id)) return false
    if (hideArchived) return !acc.archive
    return true
  })
  const archivedAmount = savingAccs.filter(acc => acc.archive).length
  const canShowArchived = hideArchived && !!archivedAmount

  return (
    <>
      {linkedAccs ? (
        <Box className={c.bg}>
          <Box mb={1}>
            <Typography variant="body2" noWrap>
              Привязанные счета
            </Typography>
          </Box>
          <div className={c.chipContainer}>
            {linkedAccs.map(accId => (
              <Chip
                key={accId}
                className={c.chip}
                label={accounts[accId].title}
                deleteIcon={<CloseIcon />}
                onDelete={() => removeConnection(accId)}
              />
            ))}
            <IconButton
              className={c.addButton + ' addButton'}
              onClick={handleClick}
              size="small"
            >
              <AddIcon fontSize="inherit" />
            </IconButton>
          </div>
        </Box>
      ) : (
        <Tooltip title="Переводы на привязанные счета будут считаться, как расход по этой категории. Это удобно для планирования инвестиций или погашения кредита.">
          <Button onClick={handleClick}>Привязать счёт</Button>
        </Tooltip>
      )}

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        {accsToAdd.length ? (
          accsToAdd.map(acc => (
            <MenuItem
              key={acc.id}
              onClick={() => {
                handleClose()
                dispatch(addConnection(acc.id, id))
              }}
            >
              {acc.title}
            </MenuItem>
          ))
        ) : (
          <MenuItem onClick={handleClose}>Нет счетов для добавления</MenuItem>
        )}
        {canShowArchived && (
          <MenuItem
            onClick={() => setHideArchived(false)}
            sx={{ color: 'info.main' }}
          >
            Показать архивные ({archivedAmount})
          </MenuItem>
        )}
      </Menu>
    </>
  )
}
