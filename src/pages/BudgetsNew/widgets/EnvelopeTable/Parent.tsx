import React, { useContext } from 'react'
import { Collapse, Box, IconButton } from '@mui/material'
import { ChevronRightIcon, DragIndicatorIcon } from 'shared/ui/Icons'
import { DragModeContext } from '../../components/DnDContext'
import { TEnvelopeId } from 'models/shared/envelopeHelpers'

type ParentProps = {
  id: TEnvelopeId
  isVisible: boolean
  isExpanded: boolean
  parent: React.ReactNode
  children?: React.ReactNode[]
  onExpandToggle: (id: TEnvelopeId) => void
  onExpandAll: () => void
  onCollapseAll: () => void
}

export const Parent = React.forwardRef<HTMLDivElement, ParentProps>(
  (props, ref) => {
    const {
      id,
      isVisible,
      isExpanded,
      parent,
      children,
      onExpandToggle,
      onExpandAll,
      onCollapseAll,
      ...rest
    } = props
    const { dragMode } = useContext(DragModeContext)

    const hasChildren = !!children && children.length > 0

    if (!isVisible) return null

    const handleExpand = (
      e: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) => {
      if (e.altKey) isExpanded ? onCollapseAll() : onExpandAll()
      else onExpandToggle(id)
    }

    return (
      <Box
        sx={{
          position: 'relative',
          background: 'background.paper',
          borderBottom: `1px solid black`,
          borderColor: 'divider',
          '&:last-child': { border: 0 },
        }}
        ref={ref}
        {...rest}
      >
        {dragMode === 'REORDER' && (
          <DragIndicatorIcon
            fontSize="small"
            color="action"
            sx={{ position: 'absolute', left: 4, top: 13 }}
          />
        )}
        {hasChildren && dragMode !== 'REORDER' && (
          <IconButton
            size="small"
            sx={{
              position: 'absolute',
              left: 0,
              top: 12,
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: '.3s',
            }}
            onClick={handleExpand}
          >
            <ChevronRightIcon fontSize="inherit" />
          </IconButton>
        )}
        {parent}

        {hasChildren && dragMode !== 'REORDER' && (
          <Collapse in={isExpanded} unmountOnExit>
            <Box pb={1}>{children}</Box>
          </Collapse>
        )}
      </Box>
    )
  }
)
