import { AccountIcon as AccountGlyph } from '@/6-shared/ui/Icons'
import type { TAccount } from '@/6-shared/types'

/** Decorative account mark; selection is owned by the surrounding control. */
export function AccountIcon({ account }: { account?: TAccount }) {
  return (
    <AccountGlyph aria-hidden data-account-type={account?.type} size={20} />
  )
}
