import { IconButton } from '@/6-shared/ui/kit/Button'
import type { core } from '@/zerro-core/redux'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Collapse } from '@/6-shared/ui/kit/Collapse'
import { ChevronRightIcon } from '@/6-shared/ui/Icons'

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

    const { t } = useTranslation('budgets')
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
            size="xs"
            shape="circle"
            variant="ghost"
            label={t(isExpanded ? 'collapseCategory' : 'expandCategory')}
            aria-expanded={isExpanded}
            className="absolute -left-[7px] top-[9px] z-[1]"
            onClick={handleExpand}
          >
            <ChevronRightIcon
              size={16}
              className={`transition-transform duration-300 motion-reduce:transition-none ${isExpanded ? 'rotate-90' : 'rotate-0'}`}
            />
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
