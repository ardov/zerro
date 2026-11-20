import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { useColorScheme } from '@/6-shared/ui/theme'
import { useDemoTilt } from './useDemoTilt'
import './LandingDemo.css'

/** The live frame preserves edits while its appearance follows the landing. */
export function LandingDemo({ previewSrc }: { previewSrc?: string }) {
  const { i18n } = useTranslation()
  const { mode } = useColorScheme()
  const russian = (i18n.resolvedLanguage || i18n.language).startsWith('ru')
  const frame = useRef<HTMLIFrameElement>(null)
  const screen = useRef<HTMLDivElement>(null)
  const surface = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [scale, setScale] = useState(0.5)
  // Keep the URL stable so appearance updates can use messages without
  // reloading the frame and discarding edits.
  const [src] = useState(
    () =>
      previewSrc ??
      `/?demo=embedded&lang=${russian ? 'ru' : 'en'}&theme=${mode}`
  )
  useDemoTilt(frame, surface)

  useEffect(() => {
    const element = screen.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / 1280)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const syncAppearance = useCallback(() => {
    frame.current?.contentWindow?.postMessage(
      {
        type: 'zerro-demo-appearance',
        language: russian ? 'ru' : 'en',
        theme: mode,
      },
      window.location.origin
    )
  }, [russian, mode])

  useEffect(() => {
    const onReady = (event: MessageEvent) => {
      if (
        event.source === frame.current?.contentWindow &&
        event.origin === window.location.origin &&
        event.data?.type === 'zerro-demo-ready'
      )
        syncAppearance()
      if (
        event.source === frame.current?.contentWindow &&
        event.origin === window.location.origin &&
        event.data?.type === 'zerro-demo-loaded'
      )
        setReady(true)
    }
    window.addEventListener('message', onReady)
    syncAppearance()
    return () => window.removeEventListener('message', onReady)
  }, [syncAppearance])

  return (
    <div
      className="auth-demo"
      style={{ '--demo-screen-radius': `${36 * scale}px` } as CSSProperties}
    >
      <section
        className="auth-demo-preview"
        data-ready={ready || undefined}
        aria-label={
          russian ? 'Интерактивное демо Zerro' : 'Interactive Zerro demo'
        }
      >
        <div className="auth-demo-perspective">
          <div ref={surface} className="auth-demo-surface">
            <div className="auth-demo-screen" ref={screen} aria-busy={!ready}>
              <iframe
                ref={frame}
                onLoad={() => {
                  syncAppearance()
                  if (previewSrc) setReady(true)
                }}
                title={
                  russian ? 'Zerro с демо-данными' : 'Zerro with demo data'
                }
                src={src}
                className="auth-demo-frame"
                style={{
                  width: 1280,
                  height: 800,
                  transform: `scale(${scale})`,
                }}
                tabIndex={0}
                sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-popups allow-popups-to-escape-sandbox"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
