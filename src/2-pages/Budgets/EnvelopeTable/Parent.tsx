import { IconButton } from '6-shared/ui/Button'
import type { core } from 'zerro-core/redux'
import React from 'react'
import { Collapse } from '6-shared/ui/Collapse'
import { ChevronRightIcon } from '6-shared/ui/Icons'

type ParentProps = {
  id: core.envelopes.TEnvelopeId
  isExpanded: boolean
  parent: React.ReactNode
  children?: React.ReactNode[]
  onExpandToggle: (id: core.envelopes.TEnvelopeId) => void
  onExpandAll: () => void
  onCollapseAll: () => void
}

export const Parent = React.forwardRef<HTMLDivElement, ParentProps>(
  (props, ref) => {
    const {
      id,
      isExpanded,
      parent,
      children,
      onExpandToggle,
      onExpandAll,
      onCollapseAll,
      ...rest
    } = props

    const hasChildren = !!children && children.length > 0

    const handleExpand = (
      e: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) => {
      if (e.altKey) isExpanded ? onCollapseAll() : onExpandAll()
      else onExpandToggle(id)
    }

    return (
      <div
        className="relative last:border-0 border-b-[0.5px] border-border bg-card"
        ref={ref}
        {...rest}
      >
        {hasChildren && (
          <IconButton
            size="small"
            className={`absolute -left-[6px] top-[10px] z-[1] transition-transform duration-300 ${isExpanded ? 'rotate-90' : 'rotate-0'}`}
            onClick={handleExpand}
          >
            <ChevronRightIcon fontSize="inherit" />
          </IconButton>
        )}
        {parent}
        {hasChildren && (
          <Collapse open={isExpanded}>
            <div className="pb-2">{children}</div>
          </Collapse>
        )}
      </div>
    )
  }
)
