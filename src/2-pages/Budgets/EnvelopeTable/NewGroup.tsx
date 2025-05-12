import React, { useState } from 'react'
import { Box, Collapse } from '@mui/material'
import { useDroppable } from '@dnd-kit/core'
import { DragTypes } from '../DnD'
import { useTranslation } from 'react-i18next'

export function NewGroup(props: { visible: boolean }) {
  const { t } = useTranslation('creatingNewGroup')
  const { visible } = props
  const [clicked, setClicked] = useState(false)
  const { setNodeRef, active, isOver } = useDroppable({
    id: 'newGroup',
    disabled: !visible,
    data: { type: DragTypes.newGroup, id: DragTypes.newGroup },
  })
  const canDrop = active?.data?.current?.type === DragTypes.envelope

  const text = isOver
    ? canDrop
      ? t('okDropIt')
      : t('categoryNeeded')
    : clicked
      ? t('dropCategoryHere')
      : t('newGroup')
  return (
    <Collapse in={visible} unmountOnExit>
      <Box ref={setNodeRef} py={1} px={2}>
        <Box
          sx={{
            p: 2,
            bgcolor: isOver && canDrop ? 'action.hover' : 'background.paper',
            textAlign: 'center',
            border: '1px dashed black',
            borderColor: 'divider',
            borderRadius: 2,
          }}
          onClick={() => setClicked(true)}
        >
          {text}
        </Box>
      </Box>
    </Collapse>
  )
}
