import React, { useCallback } from 'react'
import { DragDropContext } from 'react-beautiful-dnd'
import { Droppable, Draggable } from 'react-beautiful-dnd'
import { useSelector } from 'react-redux'

import { getTagsTree } from 'store/localData/tags'
import { ListItem, Box, List, Paper } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'

const useStyles = makeStyles(theme => ({
  listItem: { borderRadius: theme.shape.borderRadius },
}))

export function Tag({ tag, index, ...rest }) {
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
              {tag.name}
            </Box>
          </Box>
        </ListItem>
      )}
    </Draggable>
  )
}

export function Settings() {
  // const rawData = useSelector(getTotalsArray)
  const tags = useSelector(getTagsTree)

  const reorderTags = useCallback(e => {
    if (
      e.source &&
      e.destination &&
      e.source.droppableId !== e.destination.droppableId
    ) {
      const source = e.source.droppableId
      const destination = e.destination.droppableId
    }
  }, [])
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
            {({ innerRef, placeholder }, snapshot) => (
              <List dense ref={innerRef}>
                {placeholder}
                {tags.map((tag, i) => (
                  <Tag key={tag.id} tag={tag} index={i} button></Tag>
                ))}
              </List>
            )}
          </Droppable>
        </Paper>
      </Box>
    </DragDropContext>
  )
}
