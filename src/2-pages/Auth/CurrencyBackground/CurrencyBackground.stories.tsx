import type { Meta, StoryObj } from '@storybook/react-vite'
import { CurrencySandbox } from './CurrencySandbox'
import { expect, fireEvent, waitFor, within } from 'storybook/test'

const meta = {
  title: 'App/Auth/Currency Background',
  component: CurrencySandbox,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof CurrencySandbox>

export default meta
type Story = StoryObj<typeof meta>

export const Sandbox: Story = {}

export const LiveControls: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const ui = within(canvasElement)
    const stage = ui.getByRole('region', { name: 'Поле символов' })
    const art = stage.querySelector('canvas')!
    await waitFor(() =>
      expect(
        art
          .getContext('2d')!
          .getImageData(0, 0, art.width, art.height)
          .data.some((v, i) => i % 4 === 3 && v > 0)
      ).toBe(true)
    )
    const bounds = art.getBoundingClientRect()
    for (let i = 0; i < 12; i++)
      fireEvent.pointerDown(stage, {
        detail: 1,
        clientX: bounds.left + bounds.width / 2,
        clientY: bounds.top + bounds.height / 2,
      })
    await expect(art).toHaveAttribute('data-currency-state', 'flowing')
    fireEvent.click(ui.getByRole('button', { name: 'Обрушить' }))
    await waitFor(
      () => expect(art).toHaveAttribute('data-currency-state', 'settled'),
      { timeout: 20000 }
    )
    const context = art.getContext('2d')!
    const before = context.getImageData(0, 0, art.width, art.height).data
    fireEvent.pointerDown(stage, {
      pointerType: 'touch',
      button: 0,
      clientX: bounds.left + bounds.width / 2,
      clientY: bounds.bottom - 30,
    })
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      await expect(art).toHaveAttribute('data-currency-state', 'settled')
      await expect(
        context
          .getImageData(0, 0, art.width, art.height)
          .data.some((value, i) => value !== before[i])
      ).toBe(false)
    } else {
      await expect(art).toHaveAttribute('data-currency-state', 'falling')
      await waitFor(() =>
        expect(
          context
            .getImageData(0, 0, art.width, art.height)
            .data.some((value, i) => value !== before[i])
        ).toBe(true)
      )
      await waitFor(
        () => expect(art).toHaveAttribute('data-currency-state', 'settled'),
        { timeout: 20000 }
      )
    }
    fireEvent.change(ui.getByRole('slider', { name: 'Радиус' }), {
      target: { value: '200' },
    })
    await expect(ui.getByRole('slider', { name: 'Радиус' })).toHaveValue('200')
    await expect(art).toHaveAttribute('data-currency-state', 'settled')
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const oldHeight = art.height
      await new Promise<void>(resolve => {
        const observer = new ResizeObserver(() => {
          if (art.height === oldHeight) return
          observer.disconnect()
          resolve()
        })
        observer.observe(art)
        stage.style.height = `${bounds.height + 40}px`
      })
      await expect(
        context
          .getImageData(0, 0, art.width, art.height)
          .data.some((v, i) => i % 4 === 3 && v > 0)
      ).toBe(true)
      await waitFor(
        () => expect(art).toHaveAttribute('data-currency-state', 'settled'),
        { timeout: 20000 }
      )
    }
    fireEvent.click(ui.getByRole('button', { name: 'Заново' }))
    await expect(art).toHaveAttribute('data-currency-state', 'flowing')
    fireEvent.click(
      ui.getByRole('checkbox', { name: 'Обрушение после 10 кликов' })
    )
    for (let i = 0; i < 10; i++) fireEvent.pointerDown(stage, { detail: 1 })
    await waitFor(() => expect(art.dataset.currencyState).not.toBe('flowing'))
  },
}
