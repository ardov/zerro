import React from 'react'
import { Collapse, Box, IconButton } from '@mui/material'
import { ChevronRightIcon } from '@shared/ui/Icons'
import { TEnvelopeId } from '@shared/types'

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
        {hasChildren && (
          <IconButton
            size="small"
            sx={{
              position: 'absolute',
              left: -6,
              top: 10,
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: '.3s',
              zIndex: 1,
            }}
            onClick={handleExpand}
          >
            <ChevronRightIcon fontSize="inherit" />
          </IconButton>
        )}
        {parent}

        {hasChildren && (
          <Collapse in={isExpanded} unmountOnExit>
            <Box pb={1}>{children}</Box>
          </Collapse>
        )}
      </Box>
    )
  }
)
