import { useState } from 'react'
import { AccountIcon as AccountGlyph } from '@/6-shared/ui/Icons'
import type { TAccount } from '@/6-shared/types'
import { bankIconById } from '@/6-shared/zenmoney-assets/bankIcons'

/** Local bank artwork keyed by account.company; unknown or failed assets use
 * the theme-aware account glyph. Selection belongs to the surrounding control. */
export function AccountIcon({
  account,
}: {
  account?: Pick<TAccount, 'company' | 'type'>
}) {
  const [failedUrl, setFailedUrl] = useState<string>()
  const url =
    account?.company == null ? undefined : bankIconById[account.company]
  if (url && url !== failedUrl)
    return (
      <img
        src={url}
        alt=""
        aria-hidden
        width={20}
        height={20}
        className="size-5 shrink-0 object-contain"
        onError={() => setFailedUrl(url)}
      />
    )
  return <AccountGlyph aria-hidden data-account-type={account?.type} />
}
