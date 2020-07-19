import React, { useCallback } from 'react'
import { DragDropContext } from 'react-beautiful-dnd'
import { Droppable, Draggable } from 'react-beautiful-dnd'
import { useSelector, useDispatch } from 'react-redux'
import { getTagsTree } from 'store/localData/tags'
import { ListItem, Box, List, Paper } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { setTagOrder } from 'store/localData/hiddenData/tagOrder'

const useStyles = makeStyles(theme => ({
  listItem: { borderRadius: theme.shape.borderRadius },
}))

export function Settings() {
  const tags = useSelector(getTagsTree)
  const dispatch = useDispatch()
  const reorderTags = useCallback(
    e => {
      console.log(e)
      if (e.source && e.destination) {
        const list = tags.map(tag => tag.id)
        const startIndex = e.source.index
        const endIndex = e.destination.index
        const [removed] = list.splice(startIndex, 1)
        list.splice(endIndex, 0, removed)
        dispatch(setTagOrder(list))
      }
    },
    [dispatch, tags]
  )
  const onDragStart = useCallback(e => {
    if (window.navigator.vibrate) {
      window.navigator.vibrate(100)
    }
  }, [])

  return (
    <DragDropContext onDragEnd={reorderTags} onDragStart={onDragStart}>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        p={3}
      >
        <Paper>
          <Droppable droppableId={'tags'} type="FUNDS">
            {(provided, snapshot) => (
              <List dense ref={provided.innerRef} {...provided.droppableProps}>
                {tags.map((tag, i) => (
                  <Tag key={tag.id} tag={tag} index={i} button></Tag>
                ))}
                {provided.placeholder}
              </List>
            )}
          </Droppable>
        </Paper>
      </Box>
    </DragDropContext>
  )
}

function Tag({ tag, index, ...rest }) {
  const c = useStyles()
  return (
    <Draggable draggableId={tag.id ? tag.id : 'null'} index={index}>
      {(provided = {}, snapshot = {}) => (
        <ListItem
          className={c.listItem}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          {...rest}
        >
          <Box component="span" display="flex" width="100%">
            <Box flexGrow="1" component="span" className="MuiTypography-noWrap">
              {tag.title}
            </Box>
          </Box>
        </ListItem>
      )}
    </Draggable>
  )
}
