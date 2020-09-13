import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  makeStyles,
} from '@material-ui/core'
import AddIcon from '@material-ui/icons/Add'
import {
  getTagAccMap,
  addConnection,
} from 'store/localData/hiddenData/accTagMap'
import { getAccounts, getSavingAccounts } from 'store/localData/accounts'
import CloseIcon from '@material-ui/icons/Close'

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

export function LinkedAccs({ id }) {
  const c = useStyles()
  const [anchorEl, setAnchorEl] = React.useState(null)
  const linkedAccs = useSelector(state => getTagAccMap(state)[id])
  const accounts = useSelector(getAccounts)
  const savingAccs = useSelector(getSavingAccounts)
  const dispatch = useDispatch()
  const removeConnection = id => dispatch(addConnection(id, null))

  const handleClick = event => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)

  const accsToAdd = savingAccs.filter(
    acc => linkedAccs && !linkedAccs.includes(acc.id)
  )

  if (!linkedAccs) return null

  return (
    <>
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

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        {accsToAdd.map(acc => (
          <MenuItem
            key={acc.id}
            onClick={() => {
              handleClose()
              dispatch(addConnection(acc.id, id))
            }}
          >
            {acc.title}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
