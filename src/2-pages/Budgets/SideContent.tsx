import type { core } from '@/zerro-core/redux'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDate } from '@/6-shared/helpers/date'
import { useCachedValue } from '@/6-shared/hooks/useCachedValue'
import { AdaptivePanel } from '@/6-shared/ui/layout/AdaptivePanel'
import type { SurfaceName } from '@/6-shared/ui/kit/SurfaceContent'
import { MonthInfo } from './MonthInfo'
import { EnvelopePreview } from './EnvelopePreview'
import { useMonth } from './MonthProvider'
import { defineScreen, useScreenOrder } from '@/6-shared/overlays'

type TDrawerId = core.envelopes.TEnvelopeId | 'overview'

/** A screen: the envelope it shows — or the month overview — is an id, so it
 * comes back from Back, Forward and a reload. */
const envelopeScreen = defineScreen<TDrawerId>('envelope')

export const useSideContent = () => envelopeScreen.useOpen()

export function useSelectedEnvelope() {
  const id = envelopeScreen.useValue()
  return id && id !== 'overview' ? id : undefined
}

/** Docked beside the table, the month overview is part of the page and has no
 * header. As a drawer it is modal, so it takes the drawer's header and close
 * button. An envelope draws its own header either way. */
export function SideContent({ docked = false }: { docked?: boolean }) {
  const [id, setId] = envelopeScreen.use()
  const active = useScreenOrder().at(-1) === envelopeScreen.name
  const onClose = useCallback(() => setId(null), [setId])
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

  const name: SurfaceName = envelopeId
    ? { label: t('category') }
    : { title: formatDate(month, 'LLLL').toUpperCase() }
  return (
    <AdaptivePanel
      active={active}
      docked={docked}
      {...name}
      controller={{ open: !!id, setOpen: next => !next && onClose() }}
      contentClassName="p-0"
    >
      {content}
    </AdaptivePanel>
  )
}
