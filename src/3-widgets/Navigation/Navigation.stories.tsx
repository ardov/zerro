import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { useState } from 'react'
import { toast } from '@/6-shared/ui/kit/Toast'
import { Rail } from './Rail'
import { MobileNavigation } from './MobileNavigation'

const meta = {
  title: 'App/Navigation',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    app: { scenario: 'demo', globalWidgets: true },
  },
} satisfies Meta

export default meta
type Story = StoryObj

function checkNavigationGeometry(nav: HTMLElement, vertical: boolean) {
  const bounds = nav.getBoundingClientRect()
  for (const action of nav.querySelectorAll<HTMLElement>(
    '.navigation-action'
  )) {
    const tile = action.querySelector<HTMLElement>('.navigation-action-tile')!
    const icon = tile.querySelector('svg')!
    const hitArea = action.getBoundingClientRect()
    expect(getComputedStyle(tile).width).toBe('40px')
    expect(getComputedStyle(tile).height).toBe('40px')
    expect(getComputedStyle(icon).width).toBe('24px')
    expect(getComputedStyle(icon).height).toBe('24px')
    expect(parseFloat(getComputedStyle(icon).strokeWidth)).toBeCloseTo(
      action.getAttribute('aria-current') === 'page' ? 2 : 1.5
    )
    expect(vertical ? hitArea.width : hitArea.height).toBe(
      vertical ? bounds.width : bounds.height
    )
    if (!vertical) {
      const actionHeight =
        parseFloat(
          getComputedStyle(nav).getPropertyValue('--mobile-navigation-height')
        ) || 64
      expect(tile.offsetTop).toBeCloseTo((actionHeight - 40) / 2, 0)
    }
    expect(getComputedStyle(action).backgroundColor).toBe('rgba(0, 0, 0, 0)')
    const edge = nav.ownerDocument.elementFromPoint(
      vertical ? hitArea.left + 1 : hitArea.left + hitArea.width / 2,
      vertical ? hitArea.top + hitArea.height / 2 : hitArea.bottom - 1
    )
    expect(edge?.closest('a, button')).toBe(action)
  }
}

function checkFocusOutline(action: HTMLElement) {
  const tile = action.querySelector<HTMLElement>('.navigation-action-tile')!
  expect(action.matches(':focus-visible')).toBe(true)
  expect(getComputedStyle(action).outlineStyle).toBe('none')
  expect(getComputedStyle(tile).outlineStyle).toBe('solid')
  expect(parseFloat(getComputedStyle(tile).outlineWidth)).toBeGreaterThan(0)
  expect(getComputedStyle(tile).outlineOffset).toBe('1px')
}

export const DesktopRail: Story = {
  parameters: { app: { route: '/transactions' } },
  render: () => (
    <div className="flex h-[720px] bg-ui-base">
      <Rail accountsPanelFits />
      <div className="grow" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const nav = within(canvasElement).getByRole('navigation')
    checkNavigationGeometry(nav, true)
    const budget = within(nav).getByRole('link', { name: 'Budget' })
    budget.focus()
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(budget).toHaveAttribute('aria-current', 'page'))
    checkFocusOutline(budget)
    checkNavigationGeometry(nav, true)
  },
}

export const MobileBottomNavigation: Story = {
  globals: { viewport: { value: 'iphone13' } },
  parameters: { app: { route: '/transactions' } },
  render: () => (
    <div className="flex min-h-[600px] flex-col bg-ui-base">
      <span hidden data-testid="primary" className="text-ui-primary" />
      <span hidden data-testid="secondary" className="text-ui-secondary" />
      <MobileNavigation />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const nav = canvas.getByRole('navigation')
    checkNavigationGeometry(nav, false)
    expect(
      within(nav)
        .getAllByRole('link')
        .map(link => link.getAttribute('href'))
    ).toEqual(['/transactions', '/budget', '/accounts', '/stats'])
    const primary = getComputedStyle(canvas.getByTestId('primary')).color
    const secondary = getComputedStyle(canvas.getByTestId('secondary')).color
    const checkColors = () => {
      expect(nav.querySelectorAll('[aria-current="page"]')).toHaveLength(1)
      for (const action of nav.querySelectorAll('a, button')) {
        const icon = action.querySelector('svg')
        if (icon)
          expect(getComputedStyle(icon).color).toBe(
            action.getAttribute('aria-current') === 'page' ? primary : secondary
          )
      }
    }
    await waitFor(checkColors)
    const next = within(nav)
      .getAllByRole('link')
      .find(link => !link.hasAttribute('aria-current'))!
    await userEvent.click(next)
    await userEvent.unhover(next)
    await waitFor(() => {
      expect(next).toHaveAttribute('aria-current', 'page')
      checkColors()
    })
    checkNavigationGeometry(nav, false)
    const root = canvasElement.ownerDocument.documentElement
    try {
      root.style.setProperty('--layout-safe-bottom', '34px')
      await waitFor(() => {
        expect(nav.getBoundingClientRect().height).toBe(98)
        checkNavigationGeometry(nav, false)
      })
    } finally {
      root.style.removeProperty('--layout-safe-bottom')
    }
    await userEvent.tab()
    checkFocusOutline(canvasElement.ownerDocument.activeElement as HTMLElement)
  },
}

function ToastAboveNavigationHarness() {
  const [visible, setVisible] = useState(true)
  return (
    <>
      <button
        onClick={() =>
          toast.add({
            title: 'Saved above navigation',
            type: 'success',
            timeout: 0,
          })
        }
      >
        Show toast
      </button>
      <button onClick={() => setVisible(false)}>Hide navigation</button>
      {visible && <MobileNavigation />}
    </>
  )
}

export const ToastAboveNavigation: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { viewport: { value: 'iphone13' } },
  render: () => <ToastAboveNavigationHarness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Show toast' }))
    const toast = await body.findByRole('status', {
      name: 'Saved above navigation',
    })
    await waitFor(() => expect(getComputedStyle(toast).opacity).toBe('1'))
    await Promise.all(
      toast.getAnimations().map(animation => animation.finished)
    )
    const nav = canvas.getByRole('navigation')
    expect(
      nav.getBoundingClientRect().top - toast.getBoundingClientRect().bottom
    ).toBeCloseTo(16, 0)
    const root = canvasElement.ownerDocument.documentElement
    try {
      root.style.setProperty('--layout-safe-bottom', '34px')
      await waitFor(() => {
        expect(nav.getBoundingClientRect().height).toBe(98)
        expect(
          nav.getBoundingClientRect().top - toast.getBoundingClientRect().bottom
        ).toBeCloseTo(16, 0)
      })
      root.style.setProperty('--mobile-navigation-height', '72px')
      await waitFor(() => {
        expect(nav.getBoundingClientRect().height).toBe(106)
        expect(
          nav.getBoundingClientRect().top - toast.getBoundingClientRect().bottom
        ).toBeCloseTo(16, 0)
      })
    } finally {
      root.style.removeProperty('--layout-safe-bottom')
      root.style.removeProperty('--mobile-navigation-height')
    }
    await userEvent.click(
      canvas.getByRole('button', { name: 'Hide navigation' })
    )
    await waitFor(() =>
      expect(
        window.innerHeight - toast.getBoundingClientRect().bottom
      ).toBeCloseTo(16, 0)
    )
  },
}
