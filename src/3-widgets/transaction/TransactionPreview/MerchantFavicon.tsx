import type { FC, ReactNode } from 'react'
import { useState } from 'react'
import { cn } from '@/6-shared/ui/shadcn/utils'

const faviconUrl = (domain: string, size: 32 | 48) =>
  `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`

export const MerchantFavicon: FC<{ domain?: string; fallback: ReactNode }> = ({
  domain,
  fallback,
}) => {
  const [attempt, setAttempt] = useState<{
    domain: string
    size: 32 | 48 | null
    loaded: boolean
  } | null>(null)
  const current =
    domain && attempt?.domain === domain
      ? attempt
      : domain
        ? { domain, size: 48 as const, loaded: false }
        : null

  if (!current || current.size === null) return fallback

  return (
    <span className="relative inline-flex size-5 shrink-0">
      {!current.loaded && fallback}
      <img
        key={`${current.domain}-${current.size}`}
        src={faviconUrl(current.domain, current.size)}
        alt=""
        referrerPolicy="no-referrer"
        className={cn(
          'absolute inset-0 size-5 object-contain',
          !current.loaded && 'opacity-0'
        )}
        onLoad={() => setAttempt({ ...current, loaded: true })}
        onError={() =>
          setAttempt({
            ...current,
            size: current.size === 48 ? 32 : null,
            loaded: false,
          })
        }
      />
    </span>
  )
}
