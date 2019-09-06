import React from 'react'
import { connect } from 'react-redux'
import {
  setCondition,
  setTags,
  getFilterConditions,
} from 'store/filterConditions'
import {
  getSelectedIds,
  uncheckAllTransactions,
} from 'store/selectedTransactions'
import {
  setMainTagToTransactions,
  deleteTransactions,
} from 'store/data/transactions'
import { makeStyles } from '@material-ui/core/styles'
import Paper from '@material-ui/core/Paper'
import InputBase from '@material-ui/core/InputBase'
import IconButton from '@material-ui/core/IconButton'
import FilterListIcon from '@material-ui/icons/FilterList'
import Tooltip from '@material-ui/core/Tooltip'
import MoreVertIcon from '@material-ui/icons/MoreVert'
import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'
import Divider from '@material-ui/core/Divider'
import FilterDrawer from './FilterDrawer.js'

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(0, 1, 0, 2),
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  input: {
    flex: 1,
    width: 'auto',
  },
}))

function Filter({
  setCondition,
  conditions = {},
  setTags,
  selectedIds,
  ...rest
}) {
  const classes = useStyles()
  const [isDrawerVisible, setDrawerVisible] = React.useState(false)
  const toggleDrawer = () => setDrawerVisible(!isDrawerVisible)

  return (
    <Paper className={classes.root} elevation={4} {...rest}>
      <InputBase
        className={classes.input}
        value={conditions.search}
        placeholder="Поиск по комментариям"
        onChange={e => setCondition({ search: e.target.value })}
      />

      <Tooltip title="Расширенные фильтры">
        <IconButton onClick={toggleDrawer} children={<FilterListIcon />} />
      </Tooltip>

      {!!selectedIds.length && <ActionButton />}

      <FilterDrawer
        onClose={toggleDrawer}
        open={isDrawerVisible}
        {...{ conditions, setCondition, setTags }}
      />
    </Paper>
  )
}

const mapStateToProps = state => ({
  conditions: getFilterConditions(state),
  // For BulkActions
  selectedIds: getSelectedIds(state),
})

const mapDispatchToProps = dispatch => ({
  setCondition: condition => dispatch(setCondition(condition)),
  setTags: tags => dispatch(setTags(tags)),
  // For BulkActions
  setTag: (ids, tagId) => dispatch(setMainTagToTransactions(ids, tagId)),
  delete: ids => {
    dispatch(deleteTransactions(ids))
    dispatch(uncheckAllTransactions())
  },
  uncheckAll: () => dispatch(uncheckAllTransactions()),
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Filter)

function ActionButton({ onSetTag, onDelete, onUncheckAll, selectedIds }) {
  const [anchorEl, setAnchorEl] = React.useState(null)
  const classes = makeStyles({ menuIcon: { marginRight: 8 } })()
  const handleClick = event => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)

  return (
    <React.Fragment>
      <Tooltip title="Настройки">
        <IconButton onClick={handleClick} children={<MoreVertIcon />} />
      </Tooltip>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem onClick={() => {}}>
          {/* <SaveAltIcon className={classes.menuIcon} color="action" /> */}
          Скачать CSV
        </MenuItem>
        <MenuItem onClick={() => {}}>
          {/* <SaveAltIcon className={classes.menuIcon} color="action" /> */}
          Полный бэкап
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => {}}>
          {/* <ExitToAppIcon className={classes.menuIcon} color="action" /> */}
          Выйти
        </MenuItem>
      </Menu>
    </React.Fragment>
  )
}
