import { useEffect } from 'react'
import { useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'
import { useCachedValue } from '@/6-shared/hooks/useCachedValue'

const HANDOVER_MS = 250

/** Keep the owner alive while a time edit recreates the transaction ahead of navigation. */
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
