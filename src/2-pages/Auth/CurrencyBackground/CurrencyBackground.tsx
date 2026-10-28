import { useEffect, useRef } from 'react'
import { useColorScheme } from '@/6-shared/ui/theme'
import { startCurrencyBackground } from './renderer'
import './CurrencyBackground.css'

/** Decorative login artwork; lifecycle and motion preferences belong to the renderer. */
export function CurrencyBackground() {
  const { mode } = useColorScheme()
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvas.current) return startCurrencyBackground(canvas.current, mode)
  }, [mode])

  return (
    <canvas ref={canvas} className="currency-background" aria-hidden="true" />
  )
}
