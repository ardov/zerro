import { useEffect } from 'react'
import { useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'
import { useCachedValue } from '@/6-shared/hooks/useCachedValue'

const HANDOVER_MS = 250

/** A time edit recreates the entity before history names its replacement.
 * Keep the editor alive for that handover; an entity still missing afterwards
 * removes only its own Screen. The stable owner separately owns pending edits. */
export function useTransactionHandover(
  id: string | undefined,
  onGone: () => void
) {
  const gone = useAppSelector(
    state => !!id && !core.transactions.selectAll(state)[id]
  )
  const shownId = useCachedValue(id, !!id)
  useEffect(() => {
    if (!gone) return
    const timer = setTimeout(onGone, HANDOVER_MS)
    return () => clearTimeout(timer)
  }, [gone, onGone])
  return shownId
}
