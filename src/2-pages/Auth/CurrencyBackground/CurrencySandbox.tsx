import { useId, useRef, useState } from 'react'
import { Button } from '@/6-shared/ui/kit/Button'
import { CurrencyBackground } from './CurrencyBackground'
import type { CurrencyBackgroundHandle } from './CurrencyBackground'
import { defaultCurrencySettings } from './interaction'
import type { CurrencySettings } from './interaction'
import './CurrencySandbox.css'

type Control = {
  key: keyof CurrencySettings
  label: string
  min: number
  max: number
  step: number
  unit?: string
}

const groups: { title: string; controls: Control[] }[] = [
  {
    title: 'Клик',
    controls: [
      {
        key: 'radius',
        label: 'Радиус',
        min: 40,
        max: 300,
        step: 5,
        unit: 'px',
      },
      {
        key: 'rowImpulse',
        label: 'Толчок в строках',
        min: 0,
        max: 500,
        step: 10,
        unit: 'px/s',
      },
      {
        key: 'pileImpulse',
        label: 'Толчок в осыпи',
        min: 0,
        max: 700,
        step: 10,
        unit: 'px/s',
      },
    ],
  },
  {
    title: 'Пружины в строках',
    controls: [
      {
        key: 'springStiffness',
        label: 'Жёсткость',
        min: 40,
        max: 400,
        step: 10,
      },
      { key: 'springDamping', label: 'Затухание', min: 4, max: 40, step: 1 },
    ],
  },
  {
    title: 'Падение',
    controls: [
      { key: 'gravity', label: 'Гравитация', min: 0.2, max: 1.8, step: 0.05 },
      { key: 'restitution', label: 'Отскок', min: 0, max: 0.6, step: 0.01 },
      {
        key: 'airFriction',
        label: 'Сопротивление воздуха',
        min: 0,
        max: 0.04,
        step: 0.001,
      },
      {
        key: 'releaseDuration',
        label: 'Длительность обрушения',
        min: 0,
        max: 3500,
        step: 100,
        unit: 'ms',
      },
    ],
  },
]
const sandboxDefaults = { ...defaultCurrencySettings, collapseAfterClicks: 0 }

/** Runs the production canvas with live controls; never enters the app bundle. */
export function CurrencySandbox() {
  const [settings, setSettings] = useState(sandboxDefaults)
  const scene = useRef<CurrencyBackgroundHandle>(null)
  const id = useId()

  return (
    <div className="currency-sandbox">
      <section className="currency-sandbox-stage" aria-label="Поле символов">
        <CurrencyBackground ref={scene} settings={settings} />
        <div className="currency-sandbox-hint">
          <h1>Физика символов</h1>
          <p>
            Кликни по полю. В строках символы возвращаются на пружинах, в осыпи
            — разлетаются и снова падают.
          </p>
        </div>
      </section>
      <aside
        className="currency-sandbox-controls"
        aria-label="Настройки физики"
      >
        <div className="currency-sandbox-actions">
          <Button onClick={() => scene.current?.collapse()}>Обрушить</Button>
          <Button variant="secondary" onClick={() => scene.current?.reset()}>
            Заново
          </Button>
        </div>
        <p className="currency-sandbox-note">
          Параметры меняются сразу. Длительность обрушения применяется при
          следующем падении.
        </p>
        {groups.map(group => (
          <fieldset key={group.title}>
            <legend>{group.title}</legend>
            {group.controls.map(control => (
              <div className="currency-sandbox-control" key={control.key}>
                <label htmlFor={`${id}-${control.key}`}>{control.label}</label>
                <output htmlFor={`${id}-${control.key}`}>
                  {settings[control.key]}
                  {control.unit ? ` ${control.unit}` : ''}
                </output>
                <input
                  id={`${id}-${control.key}`}
                  type="range"
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  value={settings[control.key]}
                  onChange={event =>
                    setSettings(current => ({
                      ...current,
                      [control.key]: Number(event.target.value),
                    }))
                  }
                />
              </div>
            ))}
          </fieldset>
        ))}
        <label className="currency-sandbox-toggle">
          <input
            type="checkbox"
            checked={settings.collapseAfterClicks > 0}
            onChange={event =>
              setSettings(current => ({
                ...current,
                collapseAfterClicks: event.target.checked ? 10 : 0,
              }))
            }
          />
          Обрушение после 10 кликов
        </label>
        <Button variant="ghost" onClick={() => setSettings(sandboxDefaults)}>
          Настройки по умолчанию
        </Button>
        <details className="currency-sandbox-json">
          <summary>Показать настройки</summary>
          <textarea
            aria-label="Настройки в JSON"
            readOnly
            value={JSON.stringify(settings, null, 2)}
            rows={13}
          />
        </details>
      </aside>
    </div>
  )
}
