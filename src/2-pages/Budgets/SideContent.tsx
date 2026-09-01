import type { core } from '@/zerro-core/redux'
import type { FC } from 'react'
import type { CSSProperties } from 'react'
import { memo, useCallback } from 'react'
import { SideDrawer } from '@/6-shared/ui/SideDrawer'
import { MonthInfo } from './MonthInfo'
import { EnvelopePreview } from './EnvelopePreview'
import { defineScreen } from '@/6-shared/overlays'

type TDrawerId = core.envelopes.TEnvelopeId | 'overview'

/** A screen: the envelope it shows — or the month overview — is an id, so it
 * comes back from Back, Forward and a reload. */
const envelopeScreen = defineScreen<TDrawerId>('envelope')

export const useSideContent = () => envelopeScreen.useOpen()

export const SideContent: FC<{ docked?: boolean; width: number }> = props => {
  const [id, setId] = envelopeScreen.use()
  const onClose = useCallback(() => setId(null), [setId])
  return (
    <MemoSideDrawer
      open={!!id}
      onClose={onClose}
      id={id}
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
