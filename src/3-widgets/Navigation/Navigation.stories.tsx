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

export const DesktopRail: Story = {
  render: () => (
    <div className="flex h-[720px] bg-ui-base">
      <Rail />
      <div className="grow" />
    </div>
  ),
}

export const MobileBottomNavigation: Story = {
  globals: { viewport: { value: 'iphone13' } },
  parameters: { app: { route: '/transactions' } },
  render: () => (
    <div className="flex min-h-[600px] flex-col bg-ui-base">
      <span hidden data-testid="primary" className="text-ui-primary" />
      <span hidden data-testid="secondary" className="text-ui-secondary" />
      <MobileNavigation onHeightChange={() => {}} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const nav = canvas.getByRole('navigation')
    expect(
      within(nav)
        .getAllByRole('link')
        .map(link => link.getAttribute('href'))
    ).toEqual(['/budget', '/transactions', '/accounts', '/stats'])
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
  },
}

function ToastAboveNavigationHarness() {
  const [visible, setVisible] = useState(true)
  const [, setHeight] = useState(0)
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
      {visible && <MobileNavigation onHeightChange={setHeight} />}
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
    // A resized bar must move the portalled stack too, without hardcoded height.
    nav.style.paddingTop = '24px'
    await waitFor(() =>
      expect(
        nav.getBoundingClientRect().top - toast.getBoundingClientRect().bottom
      ).toBeCloseTo(16, 0)
    )
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
