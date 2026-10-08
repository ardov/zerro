import type { core } from '@/zerro-core/redux'
import type { FC } from 'react'
import { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDate } from '@/6-shared/helpers/date'
import { useCachedValue } from '@/6-shared/hooks/useCachedValue'
import { DrawerSurface } from '@/6-shared/ui/kit/Drawer'
import type { SurfaceName } from '@/6-shared/ui/kit/SurfaceContent'
import { MonthInfo } from './MonthInfo'
import { EnvelopePreview } from './EnvelopePreview'
import { useMonth } from './MonthProvider'
import { defineScreen } from '@/6-shared/overlays'

type TDrawerId = core.envelopes.TEnvelopeId | 'overview'

/** A screen: the envelope it shows — or the month overview — is an id, so it
 * comes back from Back, Forward and a reload. */
const envelopeScreen = defineScreen<TDrawerId>('envelope')

export const useSideContent = () => envelopeScreen.useOpen()

export const SideContent: FC<{ docked?: boolean }> = props => {
  const [id, setId] = envelopeScreen.use()
  const onClose = useCallback(() => setId(null), [setId])
  return (
    <MemoSideContent
      open={!!id}
      onClose={onClose}
      id={id}
      docked={props.docked}
    />
  )
}

type TSideContentProps = {
  open: boolean
  onClose: () => void
  id?: TDrawerId
  docked?: boolean
}

/** Docked beside the table, the month overview is part of the page and has no
 * header. As a drawer it is modal, so it takes the drawer's header and close
 * button. An envelope draws its own header either way. */
const MemoSideContent = memo<TSideContentProps>(props => {
  const { open, onClose, id, docked } = props
  const { t } = useTranslation('common')
  const [month] = useMonth()
  // The screen value is gone while the drawer slides out. Keep showing what
  // it showed, so a closing envelope does not turn into the month overview.
  const shownId = useCachedValue(id, !!id)
  const current = docked ? id : shownId
  const envelopeId = current && current !== 'overview' ? current : null

  const content = envelopeId ? (
    <EnvelopePreview onClose={onClose} id={envelopeId} />
  ) : (
    <MonthInfo />
  )
  if (docked) return content

  const name: SurfaceName = envelopeId
    ? { label: t('category') }
    : { title: formatDate(month, 'LLLL').toUpperCase() }
  return (
    <DrawerSurface
      {...name}
      controller={{ open, setOpen: next => !next && onClose() }}
      // The content is drawn on the card colour, as in the docked column.
      className="bg-ui-card"
      contentClassName="p-0"
    >
      {content}
    </DrawerSurface>
  )
})
