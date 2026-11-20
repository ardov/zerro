import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fireEvent, waitFor, within } from 'storybook/test'
import Auth from './index'
import { i18n } from '@/6-shared/localization'
import { defaultCurrencySettings } from './CurrencyBackground/interaction'

const meta = {
  title: 'App/Auth',
  component: Auth,
  args: { demoSrc: 'about:blank' },
  parameters: { layout: 'fullscreen', app: { scenario: 'empty' } },
} satisfies Meta<typeof Auth>

export default meta
type Story = StoryObj<typeof meta>

export const Login: Story = {
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement)
    const about = canvas.getByRole('link', { name: i18n.t('btnAbout') })
    await waitFor(() =>
      expect(canvas.getByRole('heading', { level: 1 })).toBeVisible()
    )
    await expect(about).toHaveAttribute(
      'href',
      i18n.resolvedLanguage === 'en' ? '/en/about' : '/about'
    )
    about.focus()
    await expect(about).toHaveFocus()
    await expect(
      canvas.getByRole('button', {
        name: i18n.t(
          globals.theme === 'dark' ? 'settings:lightMode' : 'settings:darkMode'
        ),
      })
    ).toBeVisible()
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

export const BackgroundGestures: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const ui = within(canvasElement)
    const page = canvasElement.querySelector<HTMLElement>('.auth-page')!
    const art = page.querySelector('canvas')!
    const context = art.getContext('2d')!
    const ink = () =>
      context
        .getImageData(0, 0, art.width, art.height)
        .data.some((v, i) => i % 4 === 3 && v > 0)
    await waitFor(() => expect(ink()).toBe(true))
    const press = { button: 0, pointerType: 'touch', isPrimary: true }
    const targets = [
      ui.getByRole('img', { name: 'Zerro' }),
      ui.getByRole('heading', { level: 1 }),
      ui.getByRole('link', { name: i18n.t('btnAbout') }),
      page.querySelector('.auth-layout')!,
    ]
    for (let i = 0; i < defaultCurrencySettings.collapseAfterClicks - 1; i++)
      fireEvent.pointerDown(targets[i % targets.length], press)
    await expect(art).toHaveAttribute('data-currency-state', 'flowing')
    fireEvent.pointerDown(
      ui.getByRole('button', { name: i18n.t('btnLogin') }),
      press
    )
    await waitFor(() => expect(art.dataset.currencyState).not.toBe('flowing'))
    const notification = await within(document.body).findByRole('status', {
      name: i18n.t('systemFell'),
    })
    await waitFor(() => expect(notification).toBeVisible())
    await expect(notification).toHaveAttribute('data-type', 'success')
    await waitFor(
      () => expect(art).toHaveAttribute('data-currency-state', 'settled'),
      { timeout: 20000 }
    )
    await expect(ink()).toBe(true)
  },
}

export const InterfacePreview: Story = {
  play: async ({ canvasElement }) => {
    const frame = canvasElement.querySelector('iframe')!
    const plate =
      canvasElement.querySelector<HTMLElement>('.auth-demo-surface')!
    await waitFor(() => expect(frame.contentDocument?.body).toBeTruthy())
    fireEvent.load(frame)
    const button = frame.contentDocument!.createElement('button')
    button.textContent = 'Interactive demo content'
    frame.contentDocument!.body.append(button)
    const resting = getComputedStyle(plate).transform
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const base = new DOMMatrix(resting)
    const press = {
      pointerId: 7,
      isPrimary: true,
      button: 0,
      pointerType: 'mouse',
    }
    const points = [
      { x: 0.1, y: 0.9, cancel: false },
      { x: 0.9, y: 0.1, cancel: true },
    ]
    try {
      for (const { x, y, cancel } of points) {
        fireEvent.pointerDown(button, {
          ...press,
          clientX: frame.clientWidth * x,
          clientY: frame.clientHeight * y,
        })
        if (reduced) {
          await new Promise<void>(resolve =>
            requestAnimationFrame(() => resolve())
          )
          await expect(getComputedStyle(plate).transform).toBe(resting)
        } else {
          const point = new DOMPoint(
            (x - 0.5) * plate.offsetWidth,
            (y - 0.5) * plate.offsetHeight
          )
          await waitFor(() => {
            const tilted = new DOMMatrix(getComputedStyle(plate).transform)
            const depth =
              tilted.transformPoint(point).z - base.transformPoint(point).z
            // The pressed corner moves away; the center stays anchored.
            expect(depth).toBeLessThan(-0.1)
            expect(depth).toBeGreaterThan(-20)
            expect(tilted.m41).toBe(0)
            expect(tilted.m42).toBe(0)
            expect(tilted.m43).toBe(0)
          })
        }
        if (cancel) fireEvent.pointerCancel(button, press)
        else fireEvent.pointerUp(canvasElement, press)
        await waitFor(() =>
          expect(getComputedStyle(plate).transform).toBe(resting)
        )
      }
      // Even a click released in one frame gets an interruptible response.
      fireEvent.pointerDown(button, { ...press, clientX: 80, clientY: 700 })
      fireEvent.pointerUp(canvasElement, press)
      if (!reduced)
        await waitFor(() =>
          expect(getComputedStyle(plate).transform).not.toBe(resting)
        )
      await waitFor(() =>
        expect(getComputedStyle(plate).transform).toBe(resting)
      )
    } finally {
      button.remove()
    }
  },
}

export const InterfaceHover: Story = {
  play: async ({ canvasElement }) => {
    const frame = canvasElement.querySelector('iframe')!
    const plate =
      canvasElement.querySelector<HTMLElement>('.auth-demo-surface')!
    await waitFor(() => expect(frame.contentDocument?.body).toBeTruthy())
    fireEvent.load(frame)
    const target = frame.contentDocument!.body
    const resting = getComputedStyle(plate).transform
    const base = new DOMMatrix(resting)
    const point = new DOMPoint(
      -0.4 * plate.offsetWidth,
      0.4 * plate.offsetHeight
    )
    const depth = () =>
      new DOMMatrix(getComputedStyle(plate).transform).transformPoint(point).z -
      base.transformPoint(point).z
    const pointer = {
      pointerId: 9,
      isPrimary: true,
      pointerType: 'mouse',
      button: 0,
      clientX: frame.clientWidth * 0.1,
      clientY: frame.clientHeight * 0.9,
    }
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const hovers = matchMedia('(hover: hover) and (pointer: fine)').matches
    // Touch movement must never create a hover response.
    fireEvent.pointerMove(target, { ...pointer, pointerType: 'touch' })
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
    await expect(getComputedStyle(plate).transform).toBe(resting)

    fireEvent.pointerMove(target, pointer)
    if (!reduced && hovers) {
      await waitFor(() => expect(depth()).toBeGreaterThan(0.1))
      expect(depth()).toBeLessThan(8)
    }
    fireEvent.pointerDown(target, pointer)
    if (!reduced) await waitFor(() => expect(depth()).toBeLessThan(-0.1))
    fireEvent.pointerUp(target, pointer)
    if (!reduced && hovers)
      await waitFor(() => expect(depth()).toBeGreaterThan(0.1))
    else
      await waitFor(() =>
        expect(getComputedStyle(plate).transform).toBe(resting)
      )

    // Leaving the embedded document restores its original, centered pose.
    fireEvent.pointerOut(target, { ...pointer, relatedTarget: null })
    await waitFor(() => expect(getComputedStyle(plate).transform).toBe(resting))
  },
}
