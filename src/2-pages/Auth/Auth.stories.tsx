import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fireEvent, waitFor, within } from 'storybook/test'
import Auth from './index'
import { i18n } from '@/6-shared/localization'

const meta = {
  title: 'App/Auth',
  component: Auth,
  parameters: { layout: 'fullscreen', app: { scenario: 'empty' } },
} satisfies Meta<typeof Auth>

export default meta
type Story = StoryObj<typeof meta>

export const Login: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const about = canvas.getByRole('button', { name: i18n.t('btnAbout') })
    await expect(about).toHaveAttribute('href', '/about')
    about.focus()
    await expect(about).toHaveFocus()
    const page = canvasElement.querySelector('.auth-page')!
    const art = canvasElement.querySelector('canvas')!
    await waitFor(() => {
      const pixels = art
        .getContext('2d')!
        .getImageData(0, 0, art.width, art.height).data
      expect(pixels.some((value, index) => index % 4 === 3 && value > 0)).toBe(
        true
      )
      expect(
        pixels.some((value, index) => index % 4 === 3 && value === 0)
      ).toBe(true)
    })
    const surface = document.createElement('div')
    surface.style.backgroundColor = 'var(--color-ui-base)'
    canvasElement.append(surface)
    try {
      const background = getComputedStyle(surface).backgroundColor
      await expect(getComputedStyle(page).backgroundColor).toBe(background)
      await expect(getComputedStyle(art).backgroundColor).toBe(
        'rgba(0, 0, 0, 0)'
      )
    } finally {
      surface.remove()
    }
    await expect(art).toHaveAttribute('aria-hidden', 'true')
    await expect(getComputedStyle(art).pointerEvents).toBe('none')
    await expect(canvas.getAllByRole('button').length).toBeGreaterThanOrEqual(3)
  },
}

export const BackupDragFeedback: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const page = canvasElement.querySelector<HTMLElement>('.auth-page')!
    const art = page.querySelector('canvas')!
    const surface = document.createElement('div')
    canvasElement.append(surface)
    try {
      surface.style.backgroundColor = 'var(--color-ui-base)'
      const base = getComputedStyle(surface).backgroundColor
      surface.style.backgroundColor = 'var(--color-ui-selected)'
      const selected = getComputedStyle(surface).backgroundColor
      const initialBounds = page.getBoundingClientRect()
      fireEvent.dragEnter(page)
      await waitFor(() =>
        expect(getComputedStyle(page).backgroundColor).toBe(selected)
      )
      // Transparent canvas pixels must reveal the page's drop feedback.
      await expect(getComputedStyle(art).backgroundColor).toBe(
        'rgba(0, 0, 0, 0)'
      )
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const style = getComputedStyle(page)
        await expect(style.transform).toBe('none')
        await expect(style.scale).toBe('none')
        await expect(style.transitionProperty).toBe('background-color')
        await expect(page.getBoundingClientRect().width).toBe(
          initialBounds.width
        )
        await expect(page.getBoundingClientRect().height).toBe(
          initialBounds.height
        )
      } else {
        await waitFor(() =>
          expect(new DOMMatrix(getComputedStyle(page).transform).a).toBeCloseTo(
            1.1
          )
        )
      }
      fireEvent.dragLeave(page)
      await waitFor(() => {
        expect(getComputedStyle(page).backgroundColor).toBe(base)
        expect(getComputedStyle(page).transform).toBe('none')
      })
    } finally {
      surface.remove()
    }
  },
}
