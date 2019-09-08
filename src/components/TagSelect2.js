import React from 'react'
import { connect } from 'react-redux'
import { TreeSelect } from 'antd'
import { getTagsTree } from 'store/data/tags'
import {
  Typography,
  Popover,
  Button,
  Paper,
  IconButton,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
} from '@material-ui/core'
import AddIcon from '@material-ui/icons/Add'

function TagSelect({ tags, onTagSelect }) {
  const [anchorEl, setAnchorEl] = React.useState(null)
  const handleClick = e => setAnchorEl(e.currentTarget)
  const handleClose = () => setAnchorEl(null)
  const open = Boolean(anchorEl)

  return (
    <>
      <IconButton onClick={handleClick}>
        <AddIcon />
      </IconButton>
      <TagSelectPopover
        tags={tags}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        onTagSelect={id => {
          console.log(id)
        }}
      />
    </>
  )
}

export default connect(
  state => ({ tags: getTagsTree(state) }),
  null
)(TagSelect)

// WIP
function TagSelectPopover({
  tags,
  open,
  anchorEl,
  incomeOnly,
  outcomeOnly,
  onTagSelect,
  onClose,
}) {
  const [search, setSearch] = React.useState('')

  const checkTag = tag =>
    tag.title.toUpperCase().includes(search.toUpperCase()) &&
    (!incomeOnly || tag.showIncome) &&
    (!outcomeOnly || tag.showOutcome)

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
    >
      <Box
        component={Paper}
        pt={1}
        px={1}
        position="sticky"
        top={0}
        zIndex={10}
        square
        elevation={0}
      >
        <TextField
          value={search}
          onChange={e => setSearch(e.target.value)}
          variant="outlined"
          placeholder="Выберите категории"
          fullWidth
          autoFocus
        />
      </Box>
      <List>
        {tags.filter(checkTag).map(tag => (
          <ListItem key={tag.id} onClick={() => onTagSelect(tag.id)} button>
            <ListItemIcon>{tag.symbol}</ListItemIcon>
            <ListItemText primary={tag.title}></ListItemText>
          </ListItem>
        ))}
      </List>
    </Popover>
  )
}
