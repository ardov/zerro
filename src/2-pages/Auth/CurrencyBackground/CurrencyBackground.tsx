import { useEffect, useImperativeHandle, useRef } from 'react'
import type { Ref } from 'react'
import { useColorScheme } from '@/6-shared/ui/theme'
import { startCurrencyBackground } from './renderer'
import './CurrencyBackground.css'
import type { CurrencySettings } from './interaction'

export type CurrencyBackgroundHandle = { collapse(): void; reset(): void }

/** Decorative login artwork; lifecycle and motion preferences belong to the renderer. */
export function CurrencyBackground({
  settings,
  ref,
}: {
  settings?: Partial<CurrencySettings>
  ref?: Ref<CurrencyBackgroundHandle>
}) {
  const { mode } = useColorScheme()
  const canvas = useRef<HTMLCanvasElement>(null)
  const renderer = useRef<ReturnType<typeof startCurrencyBackground>>(undefined)

  useEffect(() => {
    if (!canvas.current) return
    const controller = startCurrencyBackground(canvas.current, mode)
    renderer.current = controller
    return () => {
      controller?.dispose()
      renderer.current = undefined
    }
  }, [mode])

  useEffect(() => {
    renderer.current?.configure(settings ?? {})
  }, [mode, settings])

  useImperativeHandle(
    ref,
    () => ({
      collapse() {
        void renderer.current?.collapse()
      },
      reset() {
        renderer.current?.reset()
      },
    }),
    []
  )

  return (
    <canvas ref={canvas} className="currency-background" aria-hidden="true" />
  )
}
