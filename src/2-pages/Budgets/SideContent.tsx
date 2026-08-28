import type { core } from 'zerro-core/redux'
import type { FC } from 'react'
import type { CSSProperties } from 'react'
import { memo, useCallback } from 'react'
import { SideDrawer } from '6-shared/ui/SideDrawer'
import { MonthInfo } from './MonthInfo'
import { EnvelopePreview } from './EnvelopePreview'
import { registerPopover } from '6-shared/historyPopovers'

type TDrawerId = core.envelopes.TEnvelopeId | 'overview'

const sideDrawer = registerPopover<{ id: TDrawerId }>('sideContent', {
  id: 'overview',
})

export const useSideContent = () => {
  const { open } = sideDrawer.useMethods()
  return useCallback((id: TDrawerId) => open({ id }), [open])
}

export const SideContent: FC<{ docked?: boolean; width: number }> = props => {
  const drawer = sideDrawer.useProps()
  return (
    <MemoSideDrawer
      {...drawer.displayProps}
      {...drawer.extraProps}
      docked={props.docked}
      width={props.width}
    />
  )
}

type TSideContentProps = {
  open: boolean
  onClose: () => void
  id?: TDrawerId
  docked?: boolean
  width: number
}
const MemoSideDrawer = memo<TSideContentProps>(props => {
  const { open, onClose, id, docked, width } = props

  const drawerContent =
    !id || id === 'overview' ? (
      <MonthInfo onClose={onClose} />
    ) : (
      <EnvelopePreview onClose={onClose} id={id} />
    )

  if (docked) {
    return open ? drawerContent : <MonthInfo onClose={onClose} />
  }

  return (
    <SideDrawer open={open} onClose={onClose}>
      <div
        className="w-screen sm:w-[var(--side-content-width)]"
        style={{ '--side-content-width': `${width}px` } as CSSProperties}
      >
        {drawerContent}
      </div>
    </SideDrawer>
  )
})
