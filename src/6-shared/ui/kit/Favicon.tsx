import { useState, type ReactNode } from 'react'
import { faviconUrl, reportFaviconLoad } from '@/6-shared/favicon-cache'
import { cn } from '@/6-shared/ui/shadcn/utils'

export type FaviconProps = {
  domain?: string
  fallback: ReactNode
}

/** Decorative site icon. Its accessible name belongs to the surrounding control. */
export function Favicon({ domain, fallback }: FaviconProps) {
  return <FaviconImage key={domain} domain={domain} fallback={fallback} />
}

function FaviconImage({ domain, fallback }: FaviconProps) {
  const [requestId] = useState(() =>
    navigator.serviceWorker?.controller ? crypto.randomUUID() : undefined
  )
  const [size, setSize] = useState<48 | 32 | null>(48)
  const [loaded, setLoaded] = useState(false)

  return (
    <span aria-hidden="true" className="relative inline-flex size-5 shrink-0">
      <span
        className={cn(
          'absolute inset-0 inline-flex items-center justify-center transition-opacity duration-200 ease-out',
          loaded && 'opacity-0'
        )}
      >
        {fallback}
      </span>
      {domain && size !== null && (
        <span
          className={cn(
            'absolute inset-0 flex items-center justify-center rounded-[4px] bg-ui-card transition-[opacity,filter] duration-200 ease-out motion-reduce:blur-none motion-reduce:transition-opacity',
            loaded ? 'opacity-100 blur-none' : 'opacity-0 blur-[2px]'
          )}
        >
          <img
            key={size}
            src={faviconUrl(domain, size, requestId)}
            alt=""
            referrerPolicy="no-referrer"
            className="size-4 rounded-[2px] object-contain"
            onLoad={event => {
              reportFaviconLoad(event.currentTarget.src, true)
              setLoaded(true)
            }}
            onError={event => {
              reportFaviconLoad(event.currentTarget.src, false)
              setLoaded(false)
              setSize(size === 48 ? 32 : null)
            }}
          />
        </span>
      )}
    </span>
  )
}
